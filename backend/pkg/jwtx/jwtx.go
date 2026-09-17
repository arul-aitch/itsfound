package jwtx

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid token")

const defaultExpiresIn = 24 * time.Hour

type Claims struct {
	jwt.RegisteredClaims
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

func Generate(secret string, expiresIn time.Duration, userID string, role string) (string, error) {
	now := time.Now()

	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expiresIn)),
		},
		UserID: userID,
		Role:   role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return signed, nil
}

func Parse(secret string, tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, ErrInvalidToken
			}

			return []byte(secret), nil
		},
	)
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func ParseExpiresIn(s string) (time.Duration, error) {
	if s == "" {
		return defaultExpiresIn, nil
	}

	expiresIn, err := time.ParseDuration(s)
	if err != nil {
		return defaultExpiresIn, nil
	}

	return expiresIn, nil
}
