package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/arul-aitch/itsfound/backend/internal/model"
	"github.com/arul-aitch/itsfound/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrClaimNotFound      = repository.ErrNotFound
	ErrClaimForbidden     = errors.New("claim forbidden")
	ErrClaimValidation    = errors.New("claim validation error")
	ErrClaimDuplicate     = errors.New("claim already exists")
	ErrReportNotClaimable = errors.New("report not claimable")
	ErrInvalidClaimStatus = errors.New("invalid claim status")
)

type ClaimService interface {
	Create(
		ctx context.Context,
		claimantID string,
		req model.CreateClaimRequest,
	) (*model.ClaimResponse, error)

	ListMine(
		ctx context.Context,
		claimantID string,
		q model.ListClaimsQuery,
	) ([]model.ClaimResponse, error)

	ListAll(
		ctx context.Context,
		q model.ListClaimsQuery,
	) ([]model.ClaimResponse, error)

	UpdateStatus(
		ctx context.Context,
		adminID string,
		claimID string,
		req model.UpdateClaimStatusRequest,
	) (*model.ClaimResponse, error)
}

type claimService struct {
	claimRepo  repository.ClaimRepository
	reportRepo repository.ReportRepository
}

func NewClaimService(
	claimRepo repository.ClaimRepository,
	reportRepo repository.ReportRepository,
) ClaimService {
	return &claimService{
		claimRepo:  claimRepo,
		reportRepo: reportRepo,
	}
}

func (s *claimService) Create(
	ctx context.Context,
	claimantID string,
	req model.CreateClaimRequest,
) (*model.ClaimResponse, error) {
	claimantUUID, err := uuid.Parse(claimantID)
	if err != nil {
		return nil, fmt.Errorf("parse claimant id: %w", err)
	}

	evidence := strings.TrimSpace(req.Evidence)

	if len(evidence) < 10 {
		return nil, ErrClaimValidation
	}

	report, err := s.reportRepo.FindByID(ctx, req.ReportID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrClaimValidation
		}

		return nil, fmt.Errorf("find report for claim: %w", err)
	}

		if report.Type != "found" {
		return nil, ErrReportNotClaimable
	}

	if report.UserID == claimantUUID {
		return nil, ErrClaimValidation
	}

	count, err := s.claimRepo.CountByReportAndClaimant(
		ctx,
		req.ReportID,
		claimantUUID,
	)
	if err != nil {
		return nil, fmt.Errorf("check duplicate claim: %w", err)
	}

	if count > 0 {
		return nil, ErrClaimDuplicate
	}

	if report.Status != "open" {
		return nil, ErrReportNotClaimable
	}
	
	claim := &model.Claim{
		ReportID:   req.ReportID,
		ClaimantID: claimantUUID,
		Evidence:   evidence,
		Status:     "pending",
	}

	if err := s.claimRepo.Create(ctx, claim); err != nil {
		return nil, fmt.Errorf("create claim: %w", err)
	}

	report.Status = "in_claim"

	if err := s.reportRepo.Update(ctx, report); err != nil {
		return nil, fmt.Errorf("update report claim status: %w", err)
	}

	claim, claimant, claimReport, err := s.claimRepo.FindByIDWithDetail(
		ctx,
		claim.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("find created claim detail: %w", err)
	}

	response := buildClaimResponse(
		claim,
		claimant,
		claimReport,
	)

	return &response, nil
}

func (s *claimService) ListMine(
	ctx context.Context,
	claimantID string,
	q model.ListClaimsQuery,
) ([]model.ClaimResponse, error) {
	claimantUUID, err := uuid.Parse(claimantID)
	if err != nil {
		return nil, fmt.Errorf("parse claimant id: %w", err)
	}

	q.ClaimantID = &claimantUUID

	claims, claimants, reports, err := s.claimRepo.ListByClaimant(
		ctx,
		claimantUUID,
		q,
	)
	if err != nil {
		return nil, fmt.Errorf("list my claims: %w", err)
	}

	return buildClaimResponses(claims, claimants, reports), nil
}

func (s *claimService) ListAll(
	ctx context.Context,
	q model.ListClaimsQuery,
) ([]model.ClaimResponse, error) {
	claims, claimants, reports, err := s.claimRepo.ListAll(
		ctx,
		q,
	)
	if err != nil {
		return nil, fmt.Errorf("list all claims: %w", err)
	}

	return buildClaimResponses(claims, claimants, reports), nil
}

func (s *claimService) UpdateStatus(
	ctx context.Context,
	adminID string,
	claimID string,
	req model.UpdateClaimStatusRequest,
) (*model.ClaimResponse, error) {
	_ = adminID

	claimUUID, err := uuid.Parse(claimID)
	if err != nil {
		return nil, ErrClaimNotFound
	}

	status := strings.ToLower(strings.TrimSpace(req.Status))

	if status != "approved" && status != "rejected" {
		return nil, ErrInvalidClaimStatus
	}

	claim, err := s.claimRepo.FindByID(ctx, claimUUID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrClaimNotFound
		}

		return nil, fmt.Errorf("find claim before update: %w", err)
	}

	if claim.Status != "pending" {
		return nil, ErrInvalidClaimStatus
	}

	if err := s.claimRepo.UpdateStatus(
		ctx,
		claimUUID,
		status,
		req.AdminNote,
	); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrClaimNotFound
		}

		return nil, fmt.Errorf("update claim status: %w", err)
	}

	if status == "approved" {
		report, err := s.reportRepo.FindByID(ctx, claim.ReportID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return nil, ErrClaimNotFound
			}

			return nil, fmt.Errorf("find report for approval: %w", err)
		}

		report.Status = "resolved"

		if err := s.reportRepo.Update(ctx, report); err != nil {
			return nil, fmt.Errorf("resolve report after claim approval: %w", err)
		}
	}

	claim, claimant, report, err := s.claimRepo.FindByIDWithDetail(
		ctx,
		claimUUID,
	)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrClaimNotFound
		}

		return nil, fmt.Errorf("find updated claim detail: %w", err)
	}

	response := buildClaimResponse(
		claim,
		claimant,
		report,
	)

	return &response, nil
}

func buildClaimResponse(
	claim *model.Claim,
	claimant *model.ClaimantBrief,
	report *model.ClaimReportBrief,
) model.ClaimResponse {
	response := model.ClaimResponse{
		ID:         claim.ID,
		ReportID:   claim.ReportID,
		ClaimantID: claim.ClaimantID,
		Evidence:   claim.Evidence,
		Status:     claim.Status,
		AdminNote:  claim.AdminNote,
		CreatedAt:  claim.CreatedAt,
		UpdatedAt:  claim.UpdatedAt,
	}

	if claimant != nil {
		response.Claimant = *claimant
	}

	if report != nil {
		response.Report = *report
	}

	return response
}

func buildClaimResponses(
	claims []*model.Claim,
	claimants []*model.ClaimantBrief,
	reports []*model.ClaimReportBrief,
) []model.ClaimResponse {
	responses := make([]model.ClaimResponse, 0, len(claims))

	for i, claim := range claims {
		var claimant *model.ClaimantBrief
		var report *model.ClaimReportBrief

		if i < len(claimants) {
			claimant = claimants[i]
		}

		if i < len(reports) {
			report = reports[i]
		}

		responses = append(
			responses,
			buildClaimResponse(claim, claimant, report),
		)
	}

	return responses
}
