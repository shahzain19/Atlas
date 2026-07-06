use std::collections::HashMap;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};
use url::Url;
use std::sync::{Arc, Mutex};
use crate::entity::Entity;
use crate::event::Event;

type WsStream = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

pub struct AtlasClient {
    ws_url: String,
    entities: Arc<Mutex<HashMap<String, Entity>>>,
    handlers: Arc<Mutex<HashMap<String, Vec<Box<dyn Fn(Event) + Send>>>>>,
    ws: Arc<Mutex<Option<WsStream>>>,
}

impl AtlasClient {
    pub fn new(ws_url: &str) -> Self {
        Self {
            ws_url: ws_url.to_string(),
            entities: Arc::new(Mutex::new(HashMap::new())),
            handlers: Arc::new(Mutex::new(HashMap::new())),
            ws: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn connect(&self) -> Result<(), Box<dyn std::error::Error>> {
        let url = Url::parse(&self.ws_url)?;
        let (ws, _) = connect_async(url).await?;
        let mut ws_lock = self.ws.lock().unwrap();
        *ws_lock = Some(ws);
        self.send_msg(&serde_json::json!({"type": "get_snapshot"}), true).await?;
        Ok(())
    }

    pub async fn send_msg(&self, msg: &serde_json::Value, _wait_reply: bool) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
        let mut ws_lock = self.ws.lock().unwrap();
        if let Some(ws) = &mut *ws_lock {
            ws.send(Message::Text(msg.to_string())).await?;
            if _wait_reply {
                if let Some(Ok(Message::Text(reply))) = ws.next().await {
                    return Ok(Some(serde_json::from_str(&reply)?));
                }
            }
        }
        Ok(None)
    }

    pub async fn get_snapshot(&self) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
        self.send_msg(&serde_json::json!({"type": "get_snapshot"}), true).await
    }

    pub async fn start_runtime(&self) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
        self.send_msg(&serde_json::json!({"type": "start_runtime"}), true).await
    }

    pub async fn stop_runtime(&self) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
        self.send_msg(&serde_json::json!({"type": "stop_runtime"}), true).await
    }

    pub async fn emit_event(&self, event_type: &str, source: &str, payload: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        let msg = serde_json::json!({
            "type": "emit_event",
            "payload": {
                "type": event_type,
                "source": source,
                "timestamp": chrono::Utc::now().timestamp_millis(),
                "payload": payload.unwrap_or(serde_json::Value::Null),
            }
        });
        self.send_msg(&msg, false).await?;
        Ok(())
    }

    pub fn register_entity(&self, entity: Entity) {
        if let Ok(mut entities) = self.entities.lock() {
            entities.insert(entity.id.clone(), entity);
        }
    }

    pub fn unregister_entity(&self, id: &str) {
        if let Ok(mut entities) = self.entities.lock() {
            entities.remove(id);
        }
    }

    pub fn get_entity(&self, id: &str) -> Option<Entity> {
        if let Ok(entities) = self.entities.lock() {
            return entities.get(id).cloned();
        }
        None
    }

    pub fn on(&self, event_type: &str, handler: Box<dyn Fn(Event) + Send>) {
        if let Ok(mut handlers) = self.handlers.lock() {
            handlers.entry(event_type.to_string()).or_default().push(handler);
        }
    }
}
