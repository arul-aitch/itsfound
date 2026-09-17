package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/arul-aitch/itsfound/backend/internal/model"
)

var ErrNotFound = errors.New("user not found")

type UserRepository interface {
	Create(ctx context.Context, u *model.User) error
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.User, error)
}

type postgresUserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) UserRepository {
	return &postgresUserRepository{
		pool: pool,
	}
}

func (r *postgresUserRepository) Create(ctx context.Context, u *model.User) error {
	const query = `
		INSERT INTO users (
			email,
			password_hash,
			name,
			wa_number,
			role
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := r.pool.QueryRow(
		ctx,
		query,
		u.Email,
		u.PasswordHash,
		u.Name,
		u.WANumber,
		u.Role,
	).Scan(
		&u.ID,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}

func (r *postgresUserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	const query = `
		SELECT
			id,
			email,
			password_hash,
			name,
			wa_number,
			role,
			created_at,
			updated_at
		FROM users
		WHERE email = $1
	`

	u := &model.User{}

	err := r.pool.QueryRow(ctx, query, email).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.Name,
		&u.WANumber,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, fmt.Errorf("find user by email: %w", err)
	}

	return u, nil
}

func (r *postgresUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	const query = `
		SELECT
			id,
			email,
			password_hash,
			name,
			wa_number,
			role,
			created_at,
			updated_at
		FROM users
		WHERE id = $1
	`

	u := &model.User{}

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.Email,
		&u.PasswordHash,
		&u.Name,
		&u.WANumber,
		&u.Role,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, fmt.Errorf("find user by id: %w", err)
	}

	return u, nil
}