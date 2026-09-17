package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv             string
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTExpiresIn       string
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseBucket     string
}

func Load() (*Config, error) {
	if err := loadDotEnv(); err != nil {
		return nil, fmt.Errorf("load environment file: %w", err)
	}

	cfg := &Config{
		AppEnv:             os.Getenv("APP_ENV"),
		Port:               os.Getenv("PORT"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		JWTExpiresIn:       os.Getenv("JWT_EXPIRES_IN"),
		SupabaseURL:        os.Getenv("SUPABASE_URL"),
		SupabaseServiceKey: os.Getenv("SUPABASE_SERVICE_KEY"),
		SupabaseBucket:     os.Getenv("SUPABASE_BUCKET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("config: DATABASE_URL is required")
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("config: JWT_SECRET is required")
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	return cfg, nil
}

func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

func loadDotEnv() error {
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("get working directory: %w", err)
	}

	dir := cwd

	for {
		envPath := filepath.Join(dir, ".env")

		info, err := os.Stat(envPath)
		if err == nil {
			if !info.IsDir() {
				if err := godotenv.Load(envPath); err != nil {
					return fmt.Errorf("load %s: %w", envPath, err)
				}

				return nil
			}
		} else if !os.IsNotExist(err) {
			return fmt.Errorf("stat %s: %w", envPath, err)
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}

		dir = parent
	}

	return nil
}
