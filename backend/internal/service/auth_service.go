package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/arul-aitch/itsfound/backend/pkg/hasher"
	"github.com/arul-aitch/itsfound/backend/pkg/jwtx"
	"github.com/google/uuid"
)

const minPasswordLength = 8

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrValidation         = errors.New("validation error")
)

type AuthService interface {
	Register(ctx context.Context, req model.RegisterRequest) (*model.UserResponse, error)
	Login(ctx context.Context, req model.LoginRequest) (*model.UserResponse, string, error)
	Me(ctx context.Context, userID string) (*model.UserResponse, error)
}

type authService struct {
	repo         repository.UserRepository
	jwtSecret    string
	jwtExpiresIn time.Duration
}

func NewAuthService(
	repo repository.UserRepository,
	jwtSecret string,
	jwtExpiresIn time.Duration,
) AuthService {
	return &authService{
		repo:         repo,
		jwtSecret:    jwtSecret,
		jwtExpiresIn: jwtExpiresIn,
	}
}

func (s *authService) Register(
	ctx context.Context,
	req model.RegisterRequest,
) (*model.UserResponse, error) {
	if strings.TrimSpace(req.Email) == "" || !strings.Contains(req.Email, "@") {
		return nil, ErrValidation
	}

	if len(req.Password) < minPasswordLength {
		return nil, ErrValidation
	}

	if strings.TrimSpace(req.Name) == "" {
		return nil, ErrValidation
	}

	existingUser, err := s.repo.FindByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, ErrEmailAlreadyExists
	}

	if !errors.Is(err, repository.ErrNotFound) && err != nil {
		return nil, fmt.Errorf("check existing user: %w", err)
	}

	passwordHash, err := hasher.Hash(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &model.User{
		Email:        req.Email,
		PasswordHash: passwordHash,
		Name:         req.Name,
		WANumber:     req.WANumber,
		Role:         "user",
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	response := user.ToResponse()

	return &response, nil
}

func (s *authService) Login(
	ctx context.Context,
	req model.LoginRequest,
) (*model.UserResponse, string, error) {
	if strings.TrimSpace(req.Email) == "" || req.Password == "" {
		return nil, "", ErrValidation
	}

	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, "", ErrInvalidCredentials
		}

		return nil, "", fmt.Errorf("find user by email: %w", err)
	}

	if !hasher.Verify(user.PasswordHash, req.Password) {
		return nil, "", ErrInvalidCredentials
	}

	token, err := jwtx.Generate(
		s.jwtSecret,
		s.jwtExpiresIn,
		user.ID.String(),
		user.Role,
	)
	if err != nil {
		return nil, "", fmt.Errorf("generate jwt: %w", err)
	}

	response := user.ToResponse()

	return &response, token, nil
}

func (s *authService) Me(
	ctx context.Context,
	userID string,
) (*model.UserResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("find user by id: %w", err)
	}

	response := user.ToResponse()

	return &response, nil
}