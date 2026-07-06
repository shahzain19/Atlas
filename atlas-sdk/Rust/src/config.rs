use std::collections::HashMap;
use std::fs;
use std::path::Path;

pub struct Config {
    path: String,
    data: HashMap<String, serde_json::Value>,
}

impl Config {
    pub fn new(path: &str) -> Self {
        let path = if path.is_empty() { "config.json" } else { path };
        let data = Self::load_from(&path).unwrap_or_default();
        Self {
            path: path.to_string(),
            data,
        }
    }

    fn load_from(path: &str) -> Result<HashMap<String, serde_json::Value>, Box<dyn std::error::Error>> {
        if !Path::new(path).exists() {
            return Ok(HashMap::new());
        }
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(&self.data)?;
        fs::write(&self.path, content)?;
        Ok(())
    }

    pub fn get(&self, key: &str) -> Option<&serde_json::Value> {
        self.data.get(key)
    }

    pub fn set(&mut self, key: &str, value: serde_json::Value) -> Result<(), Box<dyn std::error::Error>> {
        self.data.insert(key.to_string(), value);
        self.save()
    }
}
