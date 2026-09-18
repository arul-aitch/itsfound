package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReportRepository interface {
	Create(ctx context.Context, report *model.Report) error

	// FindByIDWithDetail returns report with user, category, and location details.
	FindByIDWithDetail(
		ctx context.Context,
		id uuid.UUID,
	) (*model.Report, *model.ReportUserBrief, string, string, error)

	// List returns reports with filters, pagination, and total count.
	List(
		ctx context.Context,
		q model.ListReportsQuery,
	) ([]*model.Report, []*model.ReportUserBrief, []string, []string, int, error)

	// FindByID is used for ownership checks in the service.
	FindByID(ctx context.Context, id uuid.UUID) (*model.Report, error)

	Update(ctx context.Context, report *model.Report) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type postgresReportRepository struct {
	pool *pgxpool.Pool
}

func NewReportRepository(pool *pgxpool.Pool) ReportRepository {
	return &postgresReportRepository{
		pool: pool,
	}
}

func (r *postgresReportRepository) Create(
	ctx context.Context,
	report *model.Report,
) error {
	const query = `
		INSERT INTO reports (
			user_id,
			category_id,
			location_id,
			type,
			title,
			description,
			photo_url,
			occurred_at
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
	).Scan(
		&report.ID,
		&report.Status,
		&report.CreatedAt,
		&report.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create report: %w", err)
	}

	return nil
}

func (r *postgresReportRepository) FindByIDWithDetail(
	ctx context.Context,
	id uuid.UUID,
) (*model.Report, *model.ReportUserBrief, string, string, error) {
	const query = `
		SELECT
			r.id,
			r.user_id,
			r.category_id,
			r.location_id,
			r.type,
			r.title,
			r.description,
			r.photo_url,
			r.status,
			r.occurred_at,
			r.created_at,
			r.updated_at,
			u.id,
			u.name,
			u.wa_number,
			c.name AS category_name,
			l.name AS location_name
		FROM reports r
		JOIN users u ON u.id = r.user_id
		JOIN categories c ON c.id = r.category_id
		JOIN locations l ON l.id = r.location_id
		WHERE r.id = $1
	`

	report := &model.Report{}
	user := &model.ReportUserBrief{}
	var categoryName string
	var locationName string

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
		&user.ID,
		&user.Name,
		&user.WANumber,
		&categoryName,
		&locationName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, "", "", ErrNotFound
		}

		return nil, nil, "", "", fmt.Errorf("find report with detail: %w", err)
	}

	return report, user, categoryName, locationName, nil
}

func (r *postgresReportRepository) List(
	ctx context.Context,
	q model.ListReportsQuery,
) ([]*model.Report, []*model.ReportUserBrief, []string, []string, int, error) {
	var where strings.Builder
	where.WriteString(" WHERE 1=1")

	args := make([]any, 0)

	addArg := func(value any) string {
		args = append(args, value)
		return fmt.Sprintf("$%d", len(args))
	}

	if q.Status != "removed" {
		where.WriteString(" AND r.status != 'removed'")
	}

	if q.Status != "" && q.Status != "removed" {
		placeholder := addArg(q.Status)
		where.WriteString(" AND r.status = " + placeholder)
	}

	if q.Type != "" {
		placeholder := addArg(q.Type)
		where.WriteString(" AND r.type = " + placeholder)
	}

	if q.CategoryID != nil {
		placeholder := addArg(*q.CategoryID)
		where.WriteString(" AND r.category_id = " + placeholder)
	}

	if q.LocationID != nil {
		placeholder := addArg(*q.LocationID)
		where.WriteString(" AND r.location_id = " + placeholder)
	}

	if q.Search != "" {
		placeholder := addArg("%" + q.Search + "%")
		where.WriteString(
			" AND (r.title ILIKE " + placeholder +
				" OR r.description ILIKE " + placeholder + ")",
		)
	}

	countQuery := "SELECT COUNT(*) FROM reports r" + where.String()

	var total int

	if err := r.pool.QueryRow(
		ctx,
		countQuery,
		args...,
	).Scan(&total); err != nil {
		return nil, nil, nil, nil, 0, fmt.Errorf("count reports: %w", err)
	}

	offset := (q.Page - 1) * q.PerPage

	limitPlaceholder := fmt.Sprintf("$%d", len(args)+1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(args)+2)

	listArgs := make([]any, 0, len(args)+2)
	listArgs = append(listArgs, args...)
	listArgs = append(listArgs, q.PerPage, offset)

	query := `
		SELECT
			r.id,
			r.user_id,
			r.category_id,
			r.location_id,
			r.type,
			r.title,
			r.description,
			r.photo_url,
			r.status,
			r.occurred_at,
			r.created_at,
			r.updated_at,
			u.id,
			u.name,
			u.wa_number,
			c.name AS category_name,
			l.name AS location_name
		FROM reports r
		JOIN users u ON u.id = r.user_id
		JOIN categories c ON c.id = r.category_id
		JOIN locations l ON l.id = r.location_id
		` + where.String() + `
		ORDER BY r.created_at DESC
		LIMIT ` + limitPlaceholder + `
		OFFSET ` + offsetPlaceholder

	rows, err := r.pool.Query(ctx, query, listArgs...)
	if err != nil {
		return nil, nil, nil, nil, 0, fmt.Errorf("list reports: %w", err)
	}
	defer rows.Close()

	reports := make([]*model.Report, 0)
	users := make([]*model.ReportUserBrief, 0)
	categoryNames := make([]string, 0)
	locationNames := make([]string, 0)

	for rows.Next() {
		report := &model.Report{}
		user := &model.ReportUserBrief{}
		var categoryName string
		var locationName string

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
			&user.ID,
			&user.Name,
			&user.WANumber,
			&categoryName,
			&locationName,
		); err != nil {
			return nil, nil, nil, nil, 0, fmt.Errorf("scan report: %w", err)
		}

		reports = append(reports, report)
		users = append(users, user)
		categoryNames = append(categoryNames, categoryName)
		locationNames = append(locationNames, locationName)
	}

	if err := rows.Err(); err != nil {
		return nil, nil, nil, nil, 0, fmt.Errorf("iterate reports: %w", err)
	}

	return reports, users, categoryNames, locationNames, total, nil
}

func (r *postgresReportRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (*model.Report, error) {
	const query = `
		SELECT
			id,
			user_id,
			category_id,
			location_id,
			type,
			title,
			description,
			photo_url,
			status,
			occurred_at,
			created_at,
			updated_at
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

func (r *postgresReportRepository) Update(
	ctx context.Context,
	report *model.Report,
) error {
	const query = `
		UPDATE reports
		SET
			category_id = $2,
			location_id = $3,
			type = $4,
			title = $5,
			description = $6,
			photo_url = $7,
			occurred_at = $8,
			status = $9,
			updated_at = NOW()
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
		report.Status,
	).Scan(&report.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}

		return fmt.Errorf("update report: %w", err)
	}

	return nil
}

func (r *postgresReportRepository) Delete(
	ctx context.Context,
	id uuid.UUID,
) error {
	const query = `
		DELETE FROM reports
		WHERE id = $1
	`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete report: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
