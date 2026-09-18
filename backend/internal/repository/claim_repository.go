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

type ClaimRepository interface {
	Create(ctx context.Context, claim *model.Claim) error
	FindByID(ctx context.Context, id uuid.UUID) (*model.Claim, error)

	FindByIDWithDetail(
		ctx context.Context,
		id uuid.UUID,
	) (*model.Claim, *model.ClaimantBrief, *model.ClaimReportBrief, error)

	ListByClaimant(
		ctx context.Context,
		claimantID uuid.UUID,
		q model.ListClaimsQuery,
	) ([]*model.Claim, []*model.ClaimantBrief, []*model.ClaimReportBrief, error)

	ListAll(
		ctx context.Context,
		q model.ListClaimsQuery,
	) ([]*model.Claim, []*model.ClaimantBrief, []*model.ClaimReportBrief, error)

	CountByReportAndClaimant(
		ctx context.Context,
		reportID uuid.UUID,
		claimantID uuid.UUID,
	) (int, error)

	UpdateStatus(
		ctx context.Context,
		id uuid.UUID,
		status string,
		adminNote *string,
	) error
}

type postgresClaimRepository struct {
	pool *pgxpool.Pool
}

func NewClaimRepository(pool *pgxpool.Pool) ClaimRepository {
	return &postgresClaimRepository{
		pool: pool,
	}
}

func (r *postgresClaimRepository) Create(
	ctx context.Context,
	claim *model.Claim,
) error {
	const query = `
		INSERT INTO claims (
			report_id,
			claimant_id,
			evidence
		)
		VALUES ($1, $2, $3)
		RETURNING id, status, created_at, updated_at
	`

	err := r.pool.QueryRow(
		ctx,
		query,
		claim.ReportID,
		claim.ClaimantID,
		claim.Evidence,
	).Scan(
		&claim.ID,
		&claim.Status,
		&claim.CreatedAt,
		&claim.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create claim: %w", err)
	}

	return nil
}

func (r *postgresClaimRepository) FindByID(
	ctx context.Context,
	id uuid.UUID,
) (*model.Claim, error) {
	const query = `
		SELECT
			id,
			report_id,
			claimant_id,
			evidence,
			status,
			admin_note,
			created_at,
			updated_at
		FROM claims
		WHERE id = $1
	`

	claim := &model.Claim{}

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&claim.ID,
		&claim.ReportID,
		&claim.ClaimantID,
		&claim.Evidence,
		&claim.Status,
		&claim.AdminNote,
		&claim.CreatedAt,
		&claim.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}

		return nil, fmt.Errorf("find claim by id: %w", err)
	}

	return claim, nil
}

func (r *postgresClaimRepository) FindByIDWithDetail(
	ctx context.Context,
	id uuid.UUID,
) (*model.Claim, *model.ClaimantBrief, *model.ClaimReportBrief, error) {
	const query = `
		SELECT
			c.id,
			c.report_id,
			c.claimant_id,
			c.evidence,
			c.status,
			c.admin_note,
			c.created_at,
			c.updated_at,
			u.id,
			u.name,
			u.wa_number,
			r.id,
			r.title,
			r.type,
			r.status
		FROM claims c
		JOIN users u ON u.id = c.claimant_id
		JOIN reports r ON r.id = c.report_id
		WHERE c.id = $1
	`

	claim := &model.Claim{}
	claimant := &model.ClaimantBrief{}
	report := &model.ClaimReportBrief{}

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&claim.ID,
		&claim.ReportID,
		&claim.ClaimantID,
		&claim.Evidence,
		&claim.Status,
		&claim.AdminNote,
		&claim.CreatedAt,
		&claim.UpdatedAt,
		&claimant.ID,
		&claimant.Name,
		&claimant.WANumber,
		&report.ID,
		&report.Title,
		&report.Type,
		&report.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil, ErrNotFound
		}

		return nil, nil, nil, fmt.Errorf("find claim with detail: %w", err)
	}

	return claim, claimant, report, nil
}

func (r *postgresClaimRepository) ListByClaimant(
	ctx context.Context,
	claimantID uuid.UUID,
	q model.ListClaimsQuery,
) ([]*model.Claim, []*model.ClaimantBrief, []*model.ClaimReportBrief, error) {
	var where strings.Builder
	where.WriteString(" WHERE c.claimant_id = $1")

	args := []any{claimantID}

	addArg := func(value any) string {
		args = append(args, value)
		return fmt.Sprintf("$%d", len(args))
	}

	if q.ReportID != nil {
		placeholder := addArg(*q.ReportID)
		where.WriteString(" AND c.report_id = " + placeholder)
	}

	if q.Status != "" {
		placeholder := addArg(q.Status)
		where.WriteString(" AND c.status = " + placeholder)
	}

	query := `
		SELECT
			c.id,
			c.report_id,
			c.claimant_id,
			c.evidence,
			c.status,
			c.admin_note,
			c.created_at,
			c.updated_at,
			u.id,
			u.name,
			u.wa_number,
			r.id,
			r.title,
			r.type,
			r.status
		FROM claims c
		JOIN users u ON u.id = c.claimant_id
		JOIN reports r ON r.id = c.report_id
		` + where.String() + `
		ORDER BY c.created_at DESC
	`

	return r.list(ctx, query, args...)
}

func (r *postgresClaimRepository) ListAll(
	ctx context.Context,
	q model.ListClaimsQuery,
) ([]*model.Claim, []*model.ClaimantBrief, []*model.ClaimReportBrief, error) {
	var where strings.Builder
	where.WriteString(" WHERE 1=1")

	args := make([]any, 0)

	addArg := func(value any) string {
		args = append(args, value)
		return fmt.Sprintf("$%d", len(args))
	}

	if q.ReportID != nil {
		placeholder := addArg(*q.ReportID)
		where.WriteString(" AND c.report_id = " + placeholder)
	}

	if q.Status != "" {
		placeholder := addArg(q.Status)
		where.WriteString(" AND c.status = " + placeholder)
	}

	query := `
		SELECT
			c.id,
			c.report_id,
			c.claimant_id,
			c.evidence,
			c.status,
			c.admin_note,
			c.created_at,
			c.updated_at,
			u.id,
			u.name,
			u.wa_number,
			r.id,
			r.title,
			r.type,
			r.status
		FROM claims c
		JOIN users u ON u.id = c.claimant_id
		JOIN reports r ON r.id = c.report_id
		` + where.String() + `
		ORDER BY c.created_at DESC
	`

	return r.list(ctx, query, args...)
}

func (r *postgresClaimRepository) list(
	ctx context.Context,
	query string,
	args ...any,
) ([]*model.Claim, []*model.ClaimantBrief, []*model.ClaimReportBrief, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("list claims: %w", err)
	}
	defer rows.Close()

	claims := make([]*model.Claim, 0)
	claimants := make([]*model.ClaimantBrief, 0)
	reports := make([]*model.ClaimReportBrief, 0)

	for rows.Next() {
		claim := &model.Claim{}
		claimant := &model.ClaimantBrief{}
		report := &model.ClaimReportBrief{}

		if err := rows.Scan(
			&claim.ID,
			&claim.ReportID,
			&claim.ClaimantID,
			&claim.Evidence,
			&claim.Status,
			&claim.AdminNote,
			&claim.CreatedAt,
			&claim.UpdatedAt,
			&claimant.ID,
			&claimant.Name,
			&claimant.WANumber,
			&report.ID,
			&report.Title,
			&report.Type,
			&report.Status,
		); err != nil {
			return nil, nil, nil, fmt.Errorf("scan claim: %w", err)
		}

		claims = append(claims, claim)
		claimants = append(claimants, claimant)
		reports = append(reports, report)
	}

	if err := rows.Err(); err != nil {
		return nil, nil, nil, fmt.Errorf("iterate claims: %w", err)
	}

	return claims, claimants, reports, nil
}

func (r *postgresClaimRepository) CountByReportAndClaimant(
	ctx context.Context,
	reportID uuid.UUID,
	claimantID uuid.UUID,
) (int, error) {
	const query = `
		SELECT COUNT(*)
		FROM claims
		WHERE report_id = $1
		  AND claimant_id = $2
	`

	var count int

	if err := r.pool.QueryRow(
		ctx,
		query,
		reportID,
		claimantID,
	).Scan(&count); err != nil {
		return 0, fmt.Errorf("count claims: %w", err)
	}

	return count, nil
}

func (r *postgresClaimRepository) UpdateStatus(
	ctx context.Context,
	id uuid.UUID,
	status string,
	adminNote *string,
) error {
	const query = `
		UPDATE claims
		SET
			status = $2,
			admin_note = $3,
			updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`

	var updatedAt any

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		status,
		adminNote,
	).Scan(&updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}

		return fmt.Errorf("update claim status: %w", err)
	}

	return nil
}
