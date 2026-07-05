from typing import Any, Dict, Optional
import json
import os


class Config:
    """Configuration management for Atlas SDK."""

    def __init__(self, path: Optional[str] = None):
        self.path: str = path or "config.json"
        self.data: Dict[str, Any] = {}
        self.load()

    def load(self):
        """Load configuration from file."""
        if os.path.exists(self.path):
            try:
                with open(self.path, "r") as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load config: {e}")
                self.data = {}
        else:
            self.data = {}

    def save(self):
        """Save configuration to file."""
        try:
            with open(self.path, "w") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save config: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get a config value."""
        keys = key.split(".")
        current = self.data
        for k in keys:
            if isinstance(current, dict) and k in current:
                current = current[k]
            else:
                return default
        return current

    def set(self, key: str, value: Any):
        """Set a config value."""
        keys = key.split(".")
        current = self.data
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value
        self.save()

    def all(self) -> Dict[str, Any]:
        """Get all config as a dictionary."""
        return self.data.copy()
