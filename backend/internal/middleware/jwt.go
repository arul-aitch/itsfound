package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/arul-aitch/itsfound/backend/pkg/jwtx"
)

type contextKey string

const (
	userIDKey contextKey = "user_id"
	roleKey   contextKey = "role"
)

func JWTAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			parts := strings.Fields(authHeader)

			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				writeUnauthorized(w, "missing or invalid authorization header")
				return
			}

			claims, err := jwtx.Parse(secret, parts[1])
			if err != nil {
				writeUnauthorized(w, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, roleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

func RoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(roleKey).(string)
	return role, ok
}

func writeUnauthorized(w http.ResponseWriter, message string) {
	response := struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}{}

	response.Error.Code = "UNAUTHORIZED"
	response.Error.Message = message

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)

	_ = json.NewEncoder(w).Encode(response)
}
