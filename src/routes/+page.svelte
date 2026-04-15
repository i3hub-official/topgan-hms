<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="landing">
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <span class="badge">The Eyes of the Owner</span>
        <h1>TOPGAN<br>Hotel Audit System</h1>
        <p class="subtitle">
          Digitalize your night audit, eliminate paper registers, and catch discrepancies instantly.
          Built for Nigerian hospitality — generator tracking, bin card inventory, and real‑time red flags.
        </p>
        <div class="cta-group">
          <button on:click={() => goto('/login')} class="btn-primary">Access Dashboard →</button>
          <button class="btn-outline">Learn More</button>
        </div>
      </div>
      <div class="hero-image">
        <!-- Abstract hotel/mobile illustration (CSS-only) -->
        <div class="illustration">
          <div class="phone-mock">
            <div class="phone-screen">
              <div class="status-bar"></div>
              <div class="audit-card"></div>
              <div class="flag-red"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="features">
    <div class="container">
      <h2>Everything you need to replace paper registers</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="icon">🏨</div>
          <h3>Room Register</h3>
          <p>Digital check‑in/out, track cash/POS/transfer, real‑time occupancy.</p>
        </div>
        <div class="feature-card">
          <div class="icon">🍾</div>
          <h3>Bin Card Inventory</h3>
          <p>Opening stock → sales → closing → physical variance. Know exactly what's missing.</p>
        </div>
        <div class="feature-card">
          <div class="icon">⚡</div>
          <h3>Power Log + Fuel Efficiency</h3>
          <p>Generator hours vs fuel consumption. Alerts on abnormal L/hr (siphoning detection).</p>
        </div>
        <div class="feature-card">
          <div class="icon">⚠️</div>
          <h3>Discrepancy Engine</h3>
          <p>Automated red flags when occupied rooms have no payment — or vice versa.</p>
        </div>
        <div class="feature-card">
          <div class="icon">📱</div>
          <h3>PWA / Offline-first</h3>
          <p>Works during NEPA outages. Use on any phone like a native app.</p>
        </div>
        <div class="feature-card">
          <div class="icon">👁️</div>
          <h3>Owner Dashboard</h3>
          <p>Real‑time revenue summary, active flags, and full audit trail.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works (Night Audit Focus) -->
  <section class="how-it-works">
    <div class="container">
      <h2>How the Night Audit works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h4>Physical walk</h4>
          <p>Auditor counts occupied rooms & enters physical count.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h4>System compares</h4>
          <p>Auto‑matches with digital check‑ins and payments.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h4>Red flags generated</h4>
          <p>Any discrepancy → instant alert to owner’s dashboard.</p>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <h4>Daily snapshot</h4>
          <p>PDF report + permanent audit log for accountability.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Banner -->
  <section class="cta-banner">
    <div class="container">
      <h3>Ready to digitalize your hotel operations?</h3>
      <button on:click={() => goto('/login')} class="btn-primary large">Start your first audit →</button>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>© 2026 TOPGAN INT'L Hotel — Built for MOUAU / Nigerian hospitality environment</p>
    </div>
  </footer>
</div>

<style>
  /* Global reset & crimson accent */
  .landing {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: white;
    color: #1f2937;
  }
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  /* Hero */
  .hero {
    padding: 4rem 0 3rem;
    background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
  }
  .hero .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 3rem;
  }
  .hero-content {
    flex: 1;
    min-width: 280px;
  }
  .badge {
    background: #fee2e2;
    color: #dc2626;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
    margin-bottom: 1rem;
  }
  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.2;
    background: linear-gradient(135deg, #1f2937 0%, #dc2626 80%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 1rem;
  }
  .subtitle {
    font-size: 1.125rem;
    color: #4b5563;
    margin-bottom: 2rem;
    line-height: 1.6;
    max-width: 540px;
  }
  .cta-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .btn-primary {
    background-color: #dc2626;
    color: white;
    padding: 0.75rem 1.75rem;
    border-radius: 9999px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
  }
  .btn-primary:hover {
    background-color: #b91c1c;
    transform: translateY(-2px);
  }
  .btn-outline {
    background: transparent;
    border: 2px solid #dc2626;
    color: #dc2626;
    padding: 0.75rem 1.75rem;
    border-radius: 9999px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn-outline:hover {
    background: #dc2626;
    color: white;
  }
  .btn-primary.large {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
  }
  /* Hero illustration (simple CSS mock) */
  .hero-image {
    flex: 1;
    min-width: 280px;
    display: flex;
    justify-content: center;
  }
  .phone-mock {
    width: 260px;
    height: 520px;
    background: #1f2937;
    border-radius: 2rem;
    padding: 0.75rem;
    box-shadow: 0 25px 40px -12px rgba(0,0,0,0.25);
  }
  .phone-screen {
    background: white;
    border-radius: 1.5rem;
    height: 100%;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .status-bar {
    height: 20px;
    background: #f3f4f6;
    border-radius: 8px;
  }
  .audit-card {
    background: #f9fafb;
    height: 100px;
    border-radius: 12px;
    border-left: 4px solid #dc2626;
  }
  .flag-red {
    background: #fee2e2;
    height: 40px;
    border-radius: 8px;
    margin-top: auto;
  }
  /* Features */
  .features {
    padding: 5rem 0;
    background: white;
  }
  h2 {
    text-align: center;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2.5rem;
    color: #1f2937;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  .feature-card {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 1rem;
    transition: 0.2s;
    border: 1px solid #e5e7eb;
  }
  .feature-card:hover {
    border-color: #dc2626;
    transform: translateY(-4px);
  }
  .icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  .feature-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .feature-card p {
    color: #4b5563;
    line-height: 1.5;
  }
  /* How it works */
  .how-it-works {
    background: #fef2f2;
    padding: 4rem 0;
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    margin-top: 2rem;
  }
  .step {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    width: 200px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .step-number {
    background: #dc2626;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  /* CTA Banner */
  .cta-banner {
    background: #1f2937;
    color: white;
    text-align: center;
    padding: 4rem 2rem;
  }
  .cta-banner h3 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }
  footer {
    background: white;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    padding: 2rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
  @media (max-width: 768px) {
    h1 { font-size: 2.5rem; }
    .container { padding: 0 1rem; }
    .hero { padding: 2rem 0; }
    .feature-grid { grid-template-columns: 1fr; }
  }
</style>