package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/arul-aitch/itsfound/backend/internal/config"
	"github.com/arul-aitch/itsfound/backend/internal/handler"
	"github.com/arul-aitch/itsfound/backend/internal/middleware"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/arul-aitch/itsfound/backend/internal/service"
	"github.com/arul-aitch/itsfound/backend/pkg/jwtx"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	expiresIn, err := jwtx.ParseExpiresIn(cfg.JWTExpiresIn)
	if err != nil {
		log.Fatal(err)
	}

	dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer dbCancel()

	pool, err := pgxpool.New(dbCtx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to create database pool", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(dbCtx); err != nil {
		slog.Error("failed to ping database", "error", err)
		os.Exit(1)
	}

	slog.Info("database connection successful")

	userRepo := repository.NewUserRepository(pool)
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, expiresIn)
	authHandler := handler.NewAuthHandler(authSvc)

	reportRepo := repository.NewReportRepository(pool)
	reportSvc := service.NewReportService(reportRepo)
	reportHandler := handler.NewReportHandler(reportSvc)

	claimRepo := repository.NewClaimRepository(pool)
	claimSvc := service.NewClaimService(claimRepo, reportRepo)
	claimHandler := handler.NewClaimHandler(claimSvc)

	r := chi.NewRouter()

	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(corsMiddleware)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		response := map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			slog.Error("failed to encode health response", "error", err)
		}
	})

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		r.With(middleware.JWTAuth(cfg.JWTSecret)).Get(
			"/auth/me",
			authHandler.Me,
		)

		r.Route("/reports", func(r chi.Router) {
			r.Get("/", reportHandler.List)

			r.With(middleware.JWTAuth(cfg.JWTSecret)).Get(
				"/me",
				reportHandler.ListMine,
			)

			r.With(middleware.JWTAuth(cfg.JWTSecret)).Patch(
				"/{id}/status",
				reportHandler.UpdateStatus,
			)

			r.Get("/{id}", reportHandler.GetByID)

			r.With(middleware.JWTAuth(cfg.JWTSecret)).Post(
				"/",
				reportHandler.Create,
			)

			r.With(middleware.JWTAuth(cfg.JWTSecret)).Put(
				"/{id}",
				reportHandler.Update,
			)

			r.With(middleware.JWTAuth(cfg.JWTSecret)).Delete(
				"/{id}",
				reportHandler.Delete,
			)
		})

		r.With(middleware.JWTAuth(cfg.JWTSecret)).Post(
			"/claims",
			claimHandler.Create,
		)

		r.With(middleware.JWTAuth(cfg.JWTSecret)).Get(
			"/claims/me",
			claimHandler.ListMine,
		)

		r.With(middleware.JWTAuth(cfg.JWTSecret)).Get(
			"/admin/claims",
			claimHandler.ListAll,
		)

		r.With(middleware.JWTAuth(cfg.JWTSecret)).Patch(
			"/admin/claims/{id}",
			claimHandler.UpdateStatus,
		)
	})

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(
		context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
	)
	defer stop()

	serverErr := make(chan error, 1)

	go func() {
		slog.Info(
			"server started",
			"port",
			cfg.Port,
			"environment",
			cfg.AppEnv,
		)

		serverErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErr:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server stopped unexpectedly", "error", err)
			os.Exit(1)
		}

	case <-ctx.Done():
		slog.Info("shutdown signal received")

		shutdownCtx, cancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			slog.Error("graceful shutdown failed", "error", err)
			os.Exit(1)
		}
	}

	slog.Info("server stopped")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		allowedOrigins := map[string]bool{
			"http://localhost:3000":       true,
			"https://itsfound.vercel.app": true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
			)
			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			)
			w.Header().Set("Vary", "Origin")
		}

		if r.Method == http.MethodOptions {
			if allowedOrigins[origin] {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			w.WriteHeader(http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}