use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub entity_type: String,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: i64,
}

impl Entity {
    pub fn new(id: &str, name: &str, entity_type: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            entity_type: entity_type.to_string(),
            metadata: HashMap::new(),
            created_at: Utc::now().timestamp_millis(),
        }
    }

    pub fn set_meta(&mut self, key: &str, value: serde_json::Value) {
        self.metadata.insert(key.to_string(), value);
    }

    pub fn get_meta(&self, key: &str) -> Option<&serde_json::Value> {
        self.metadata.get(key)
    }
}
