# ---------- Build stage ----------
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git untuk go mod download (kalau butuh)
RUN apk add --no-cache git

# Copy go.mod & go.sum dulu (layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/api

# ---------- Run stage ----------
FROM alpine:3.20

WORKDIR /app

# CA certs untuk HTTPS request (Supabase, dll)
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]