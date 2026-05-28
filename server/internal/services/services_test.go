package services_test

import (
	"testing"
	"time"

	"github.com/annanodiyo/Eco-waste/server/internal/services"
)

// ---------------------------------------------------------------------------
// QR code tests
// ---------------------------------------------------------------------------

func TestGenerateAndDecodeQR(t *testing.T) {
	pid := "test-product-abc123"

	b64, err := services.GenerateQR(pid)
	if err != nil {
		t.Fatalf("GenerateQR failed: %v", err)
	}
	if b64 == "" {
		t.Fatal("expected non-empty base64 QR image")
	}
}

func TestSignAndVerifyQRPayload(t *testing.T) {
	pid := "product-xyz-789"
	expires := time.Now().Add(24 * time.Hour)

	payload := services.SignPayload(pid, expires)

	if payload.PID != pid {
		t.Errorf("expected PID %q, got %q", pid, payload.PID)
	}
	if payload.Sig == "" {
		t.Error("expected non-empty signature")
	}

	ok, err := services.VerifyQR(payload)
	if err != nil {
		t.Fatalf("VerifyQR returned error: %v", err)
	}
	if !ok {
		t.Error("expected VerifyQR to return true for valid payload")
	}
}

func TestVerifyQR_ExpiredPayload(t *testing.T) {
	pid := "expired-product"
	expires := time.Now().Add(-1 * time.Minute) // already expired

	payload := services.SignPayload(pid, expires)

	ok, err := services.VerifyQR(payload)
	if err == nil {
		t.Error("expected an error for expired QR")
	}
	if ok {
		t.Error("expected VerifyQR to return false for expired payload")
	}
}

func TestVerifyQR_TamperedSignature(t *testing.T) {
	pid := "legit-product"
	payload := services.SignPayload(pid, time.Now().Add(time.Hour))

	// Tamper with the signature
	payload.Sig = "0000000000000000000000000000000000000000000000000000000000000000"

	ok, err := services.VerifyQR(payload)
	if err == nil {
		t.Error("expected an error for tampered QR")
	}
	if ok {
		t.Error("expected VerifyQR to return false for tampered payload")
	}
}

// ---------------------------------------------------------------------------
// JWT / auth helper tests
// ---------------------------------------------------------------------------

func TestGenerateAndVerifyJWTToken(t *testing.T) {
	wallet := "0xabcdef1234567890abcdef1234567890abcdef12"
	role := "COLLECTOR"

	token, err := services.GenerateJWTToken(wallet, role)
	if err != nil {
		t.Fatalf("GenerateJWTToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty JWT token")
	}

	gotWallet, gotRole, err := services.VerifyJWTToken(token)
	if err != nil {
		t.Fatalf("VerifyJWTToken failed: %v", err)
	}
	if gotWallet != wallet {
		t.Errorf("wallet mismatch: want %q, got %q", wallet, gotWallet)
	}
	if gotRole != role {
		t.Errorf("role mismatch: want %q, got %q", role, gotRole)
	}
}

func TestVerifyJWTToken_InvalidToken(t *testing.T) {
	_, _, err := services.VerifyJWTToken("not.a.valid.jwt")
	if err == nil {
		t.Error("expected error for invalid JWT")
	}
}

func TestGenerateNonce_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		n := services.GenerateNonce()
		if n == "" {
			t.Fatal("empty nonce generated")
		}
		if seen[n] {
			t.Fatalf("duplicate nonce generated on iteration %d: %q", i, n)
		}
		seen[n] = true
	}
}

// ---------------------------------------------------------------------------
// Worker pool tests
// ---------------------------------------------------------------------------

func TestWorkerPool_SubmitAndExecute(t *testing.T) {
	ctx := t.Context()
	wp := services.NewWorkerPool(2, 16)
	wp.Start(ctx)
	defer wp.Shutdown()

	done := make(chan struct{}, 3)
	for i := 0; i < 3; i++ {
		wp.Submit(services.Job{
			Name: "test-job",
			Execute: func() error {
				done <- struct{}{}
				return nil
			},
		})
	}

	received := 0
	timeout := time.After(2 * time.Second)
	for received < 3 {
		select {
		case <-done:
			received++
		case <-timeout:
			t.Fatalf("timed out waiting for workers; only %d/3 jobs completed", received)
		}
	}
}

func TestWorkerPool_FullQueue_DoesNotBlock(t *testing.T) {
	// Queue size = 1, no workers started -> queue will fill immediately
	wp := services.NewWorkerPool(0, 1)
	// Fill the one slot
	wp.Submit(services.Job{Name: "fill", Execute: func() error { return nil }})
	// This must return false without blocking
	ok := wp.Submit(services.Job{Name: "overflow", Execute: func() error { return nil }})
	if ok {
		t.Error("expected Submit to return false when queue is full")
	}
}

func TestSubmitAsync_FallsBackWhenPoolNil(t *testing.T) {
	// Ensure DefaultWorkerPool is nil for this test
	original := services.DefaultWorkerPool
	services.DefaultWorkerPool = nil
	defer func() { services.DefaultWorkerPool = original }()

	ran := false
	services.SubmitAsync("sync-fallback", func() error {
		ran = true
		return nil
	})
	if !ran {
		t.Error("expected sync fallback to run the job immediately")
	}
}
