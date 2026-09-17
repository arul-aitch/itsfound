package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepository interface {
	Create(ctx context.Context, report *model.Report) error
	FindAll(ctx context.Context) ([]*model.Report, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Report, error)
	Update(ctx context.Context, report *model.Report) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type postgresReportRepository struct {
	pool *pgxpool.Pool
}

func NewReportRepository(pool *pgxpool.Pool) ReportRepository {
	return &postgresReportRepository{pool: pool}
}

func (r *postgresReportRepository) Create(ctx context.Context, report *model.Report) error {
	const query = `
		INSERT INTO reports (
			user_id, category_id, location_id, type, title, description, photo_url, occurred_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, status, created_at, updated_at
	`

	err := r.pool.QueryRow(
		ctx,
		query,
		report.UserID,
		report.CategoryID,
		report.LocationID,
		report.Type,
		report.Title,
		report.Description,
		report.PhotoURL,
		report.OccurredAt,
	).Scan(&report.ID, &report.Status, &report.CreatedAt, &report.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create report: %w", err)
	}

	return nil
}

func (r *postgresReportRepository) FindAll(ctx context.Context) ([]*model.Report, error) {
	const query = `
		SELECT id, user_id, category_id, location_id, type, title, description,
		       photo_url, status, occurred_at, created_at, updated_at
		FROM reports
		ORDER BY created_at DESC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("find all reports: %w", err)
	}
	defer rows.Close()

	reports := make([]*model.Report, 0)

	for rows.Next() {
		report := &model.Report{}
		if err := rows.Scan(
			&report.ID,
			&report.UserID,
			&report.CategoryID,
			&report.LocationID,
			&report.Type,
			&report.Title,
			&report.Description,
			&report.PhotoURL,
			&report.Status,
			&report.OccurredAt,
			&report.CreatedAt,
			&report.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan report: %w", err)
		}
		reports = append(reports, report)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate reports: %w", err)
	}

	return reports, nil
}

func (r *postgresReportRepository) FindByID(ctx context.Context, id uuid.UUID) (*model.Report, error) {
	const query = `
		SELECT id, user_id, category_id, location_id, type, title, description,
		       photo_url, status, occurred_at, created_at, updated_at
		FROM reports
		WHERE id = $1
	`

	report := &model.Report{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&report.ID,
		&report.UserID,
		&report.CategoryID,
		&report.LocationID,
		&report.Type,
		&report.Title,
		&report.Description,
		&report.PhotoURL,
		&report.Status,
		&report.OccurredAt,
		&report.CreatedAt,
		&report.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("find report by id: %w", err)
	}

	return report, nil
}

func (r *postgresReportRepository) Update(ctx context.Context, report *model.Report) error {
	const query = `
		UPDATE reports
		SET category_id = $2, location_id = $3, type = $4, title = $5,
		    description = $6, photo_url = $7, occurred_at = $8, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	err := r.pool.QueryRow(
		ctx,
		query,
		report.ID,
		report.CategoryID,
		report.LocationID,
		report.Type,
		report.Title,
		report.Description,
		report.PhotoURL,
		report.OccurredAt,
	).Scan(&report.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("update report: %w", err)
	}

	return nil
}

func (r *postgresReportRepository) Delete(ctx context.Context, id uuid.UUID) error {
	const query = `DELETE FROM reports WHERE id = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete report: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
