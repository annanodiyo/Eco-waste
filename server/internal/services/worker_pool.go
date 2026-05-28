package services

import (
	"context"
	"log"
	"sync"
)

// Job is a unit of async work submitted to the worker pool.
type Job struct {
	Name    string
	Execute func() error
}

// WorkerPool processes Jobs concurrently using a fixed number of goroutines.
type WorkerPool struct {
	queue      chan Job
	numWorkers int
	wg         sync.WaitGroup
}

// NewWorkerPool creates a pool with the given concurrency and queue capacity.
func NewWorkerPool(numWorkers, queueSize int) *WorkerPool {
	return &WorkerPool{
		queue:      make(chan Job, queueSize),
		numWorkers: numWorkers,
	}
}

// Start launches the worker goroutines; they run until ctx is cancelled.
func (wp *WorkerPool) Start(ctx context.Context) {
	for i := 0; i < wp.numWorkers; i++ {
		wp.wg.Add(1)
		go wp.worker(ctx, i)
	}
	log.Printf("[workers] started %d worker goroutines\n", wp.numWorkers)
}

func (wp *WorkerPool) worker(ctx context.Context, id int) {
	defer wp.wg.Done()
	for {
		select {
		case <-ctx.Done():
			log.Printf("[workers] worker %d shutting down\n", id)
			return
		case job, ok := <-wp.queue:
			if !ok {
				return
			}
			if err := job.Execute(); err != nil {
				log.Printf("[workers] job %q failed: %v\n", job.Name, err)
			}
		}
	}
}

// Submit enqueues a job without blocking.  Returns false if the queue is full.
func (wp *WorkerPool) Submit(job Job) bool {
	select {
	case wp.queue <- job:
		return true
	default:
		log.Printf("[workers] queue full — dropping job %q\n", job.Name)
		return false
	}
}

// Shutdown drains the queue and waits for all workers to finish.
func (wp *WorkerPool) Shutdown() {
	close(wp.queue)
	wp.wg.Wait()
	log.Println("[workers] all workers stopped")
}

// DefaultWorkerPool is the application-wide pool; initialised by StartService.
var DefaultWorkerPool *WorkerPool

// InitWorkerPool creates and starts the default pool.
func InitWorkerPool(ctx context.Context) {
	DefaultWorkerPool = NewWorkerPool(4, 256)
	DefaultWorkerPool.Start(ctx)
}

// SubmitAsync is a convenience wrapper that submits to DefaultWorkerPool.
func SubmitAsync(name string, fn func() error) {
	if DefaultWorkerPool == nil {
		// Pool not ready — run synchronously so nothing is silently dropped.
		if err := fn(); err != nil {
			log.Printf("[workers] sync fallback job %q failed: %v\n", name, err)
		}
		return
	}
	DefaultWorkerPool.Submit(Job{Name: name, Execute: fn})
}
