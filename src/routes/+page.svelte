<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let currentYear = new Date().getFullYear();
  let mobileMenuOpen = false;
  let stats = {
    auditsRun: 0,
    discrepanciesFound: 0,
    revenueProtected: 0,
    activeRooms: 0
  };
  
  onMount(async () => {
    // Fetch dashboard stats
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    
    // Animate stats on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
        }
      });
    });
    
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });
  });
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
</script>

<svelte:head>
  <title>TOPGAN HMS - Complete Hotel Management System</title>
  <meta name="description" content="Professional hotel management system with night audit, inventory control, and real-time analytics. Trusted by hotels across Nigeria." />
  <meta name="keywords" content="hotel management, PMS, night audit, inventory system, hotel software" />
</svelte:head>

<!-- Navigation Bar -->
<nav class="bg-white shadow-md fixed w-full z-50 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex items-center cursor-pointer" on:click={() => goto('/')}>
        <div class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TOPGAN HMS
        </div>
        <span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Pro</span>
      </div>
      
      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center space-x-8">
        <a href="#features" class="text-gray-700 hover:text-blue-600 transition">Features</a>
        <a href="#audit" class="text-gray-700 hover:text-blue-600 transition">Night Audit</a>
        <a href="#pricing" class="text-gray-700 hover:text-blue-600 transition">Pricing</a>
        <a href="#contact" class="text-gray-700 hover:text-blue-600 transition">Contact</a>
        <button
          on:click={() => goto('/dashboard')}
          class="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
        >
          Launch App
        </button>
      </div>
      
      <!-- Mobile Menu Button -->
      <button class="md:hidden" on:click={() => mobileMenuOpen = !mobileMenuOpen}>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
    
    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t">
        <div class="flex flex-col space-y-3">
          <a href="#features" class="text-gray-700 hover:text-blue-600 py-2" on:click={() => mobileMenuOpen = false}>Features</a>
          <a href="#audit" class="text-gray-700 hover:text-blue-600 py-2" on:click={() => mobileMenuOpen = false}>Night Audit</a>
          <a href="#pricing" class="text-gray-700 hover:text-blue-600 py-2" on:click={() => mobileMenuOpen = false}>Pricing</a>
          <a href="#contact" class="text-gray-700 hover:text-blue-600 py-2" on:click={() => mobileMenuOpen = false}>Contact</a>
          <button on:click={() => goto('/dashboard')} class="bg-blue-600 text-white px-4 py-2 rounded-lg">Launch App</button>
        </div>
      </div>
    {/if}
  </div>
</nav>

<!-- Hero Section -->
<section class="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- Hero Text -->
      <div class="animate-on-scroll opacity-0">
        <div class="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-6">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Trusted by Hotels Across Nigeria
        </div>
        <h1 class="text-4xl lg:text-6xl font-bold leading-tight mb-6">
          Complete Hotel Management
          <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            System
          </span>
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          The "Eyes of the Owner" - Real-time discrepancy detection, inventory control, and power management. Stop revenue leakage today.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <button
            on:click={() => goto('/dashboard')}
            class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
          >
            Start Free Trial
          </button>
          <button
            on:click={() => goto('/audit')}
            class="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Try Night Audit →
          </button>
        </div>
        <div class="flex items-center gap-6 mt-8 text-sm text-gray-500">
          <div class="flex items-center gap-2">✓ No credit card required</div>
          <div class="flex items-center gap-2">✓ 14-day free trial</div>
          <div class="flex items-center gap-2">✓ 24/7 support</div>
        </div>
      </div>
      
      <!-- Hero Image/Animation -->
      <div class="relative animate-on-scroll opacity-0">
        <div class="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-1 shadow-2xl">
          <div class="bg-white rounded-xl p-6">
            <div class="space-y-4">
              <!-- Live Audit Preview -->
              <div class="flex justify-between items-center border-b pb-3">
                <span class="font-semibold">Night Audit Dashboard</span>
                <span class="text-green-600 text-sm">● Live</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 p-3 rounded-lg">
                  <div class="text-sm text-gray-600">System Occupied</div>
                  <div class="text-2xl font-bold text-green-700">12</div>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg">
                  <div class="text-sm text-gray-600">Physical Count</div>
                  <div class="text-2xl font-bold text-blue-700">14</div>
                </div>
              </div>
              <div class="bg-red-50 p-3 rounded-lg">
                <div class="text-sm text-red-600">⚠️ Discrepancy Detected</div>
                <div class="font-bold text-red-700">+2 rooms occupied but not in system</div>
                <div class="text-xs text-red-600 mt-1">Estimated loss: ₦45,000</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Floating elements -->
        <div class="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-bounce"></div>
      </div>
    </div>
  </div>
</section>

<!-- Stats Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="text-center">
        <div class="text-3xl font-bold text-blue-600">{stats.auditsRun || 1,234}+</div>
        <div class="text-gray-600 mt-2">Audits Run</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-red-600">{stats.discrepanciesFound || 89}</div>
        <div class="text-gray-600 mt-2">Discrepancies Found</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-green-600">{formatCurrency(stats.revenueProtected || 2450000)}+</div>
        <div class="text-gray-600 mt-2">Revenue Protected</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-purple-600">{stats.activeRooms || 45}</div>
        <div class="text-gray-600 mt-2">Active Rooms</div>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold mb-4">
        Everything You Need to Run Your Hotel
      </h2>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Complete solution for hotel management, from night audit to inventory control
      </p>
    </div>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Feature 1 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">🔍</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Night Audit System</h3>
        <p class="text-gray-600">Real-time discrepancy detection between physical occupancy and system records. Stop revenue leakage instantly.</p>
        <div class="mt-4 text-sm text-blue-600">✓ Automatic flagging</div>
        <div class="text-sm text-blue-600">✓ Revenue loss estimation</div>
      </div>
      
      <!-- Feature 2 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">🏨</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Room Management</h3>
        <p class="text-gray-600">Complete check-in/out system with real-time room status tracking and rate management.</p>
        <div class="mt-4 text-sm text-green-600">✓ Instant status updates</div>
        <div class="text-sm text-green-600">✓ Multiple payment methods</div>
      </div>
      
      <!-- Feature 3 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">📦</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Inventory Control</h3>
        <p class="text-gray-600">Bin card system for bar, store, and kitchen with automatic reorder alerts.</p>
        <div class="mt-4 text-sm text-purple-600">✓ Real-time stock levels</div>
        <div class="text-sm text-purple-600">✓ Low stock notifications</div>
      </div>
      
      <!-- Feature 4 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">⚡</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Power Generator Log</h3>
        <p class="text-gray-600">Track generator efficiency, fuel consumption, and detect abnormal usage patterns.</p>
        <div class="mt-4 text-sm text-yellow-600">✓ Fuel efficiency tracking</div>
        <div class="text-sm text-yellow-600">✓ High consumption alerts</div>
      </div>
      
      <!-- Feature 5 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">📊</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Reports & Analytics</h3>
        <p class="text-gray-600">Comprehensive reports with export to CSV/PDF for accounting and audit purposes.</p>
        <div class="mt-4 text-sm text-red-600">✓ Audit trail history</div>
        <div class="text-sm text-red-600">✓ Financial summaries</div>
      </div>
      
      <!-- Feature 6 -->
      <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
        <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
          <span class="text-2xl">🔒</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">Secure & Reliable</h3>
        <p class="text-gray-600">Enterprise-grade security with encrypted data and automatic backups.</p>
        <div class="mt-4 text-sm text-indigo-600">✓ Data encryption</div>
        <div class="text-sm text-indigo-600">✓ Automatic backups</div>
      </div>
    </div>
  </div>
</section>

<!-- Night Audit Focus Section -->
<section id="audit" class="py-20 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-block bg-white/20 rounded-full px-4 py-1 text-sm mb-6">
          🚨 Core Feature
        </div>
        <h2 class="text-3xl lg:text-4xl font-bold mb-6">
          The "Eyes of the Owner" Night Audit
        </h2>
        <p class="text-lg text-blue-100 mb-6">
          Stop losing money to unrecorded walk-in guests and staff fraud. Our night audit system catches discrepancies instantly.
        </p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span>Real-time comparison between physical and system occupancy</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span>Automatic flagging of unrecorded rooms</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span>Estimated revenue loss calculation</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="text-2xl">✓</span>
            <span>Complete audit trail with PDF reports</span>
          </li>
        </ul>
        <button
          on:click={() => goto('/audit')}
          class="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition transform hover:scale-105"
        >
          Try Night Audit Demo →
        </button>
      </div>
      <div class="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div class="bg-white rounded-xl p-4 text-gray-900">
          <div class="font-semibold mb-3">Sample Audit Result</div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>System Occupied:</span>
              <span class="font-bold">12 rooms</span>
            </div>
            <div class="flex justify-between">
              <span>Physical Count:</span>
              <span class="font-bold text-red-600">14 rooms</span>
            </div>
            <div class="border-t pt-2 mt-2">
              <div class="text-red-600 font-bold">⚠️ Discrepancy: +2 rooms</div>
              <div class="text-sm text-gray-600 mt-1">Flagged: Room 204, Room 305</div>
              <div class="text-sm font-bold mt-2">Estimated Loss: ₦45,000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold mb-4">
        Simple, Transparent Pricing
      </h2>
      <p class="text-xl text-gray-600">
        No hidden fees. Cancel anytime.
      </p>
    </div>
    
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Basic Plan -->
      <div class="border rounded-xl p-6 hover:shadow-xl transition">
        <h3 class="text-xl font-bold mb-2">Starter</h3>
        <div class="text-3xl font-bold mb-4">₦25,000<span class="text-sm text-gray-500">/month</span></div>
        <ul class="space-y-2 mb-6">
          <li>✓ Up to 20 rooms</li>
          <li>✓ Night audit system</li>
          <li>✓ Basic reporting</li>
          <li>✓ Email support</li>
        </ul>
        <button class="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition">
          Get Started
        </button>
      </div>
      
      <!-- Professional Plan (Popular) -->
      <div class="border-2 border-blue-600 rounded-xl p-6 shadow-xl relative">
        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
          Most Popular
        </div>
        <h3 class="text-xl font-bold mb-2">Professional</h3>
        <div class="text-3xl font-bold mb-4">₦50,000<span class="text-sm text-gray-500">/month</span></div>
        <ul class="space-y-2 mb-6">
          <li>✓ Up to 50 rooms</li>
          <li>✓ Night audit + inventory</li>
          <li>✓ Power generator log</li>
          <li>✓ Priority support</li>
          <li>✓ Export to Excel/PDF</li>
        </ul>
        <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          Start Free Trial
        </button>
      </div>
      
      <!-- Enterprise Plan -->
      <div class="border rounded-xl p-6 hover:shadow-xl transition">
        <h3 class="text-xl font-bold mb-2">Enterprise</h3>
        <div class="text-3xl font-bold mb-4">Custom</div>
        <ul class="space-y-2 mb-6">
          <li>✓ Unlimited rooms</li>
          <li>✓ All features included</li>
          <li>✓ API access</li>
          <li>✓ 24/7 phone support</li>
          <li>✓ Custom integrations</li>
        </ul>
        <button class="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition">
          Contact Sales
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl lg:text-4xl font-bold mb-4">
        Trusted by Hotel Owners
      </h2>
      <p class="text-xl text-gray-600">
        See what our customers are saying
      </p>
    </div>
    
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-white rounded-xl p-6 shadow">
        <div class="text-yellow-400 text-xl mb-3">★★★★★</div>
        <p class="text-gray-600 mb-4">"The night audit feature alone paid for itself in the first week. We caught 3 unrecorded walk-ins!"</p>
        <div class="font-semibold">Chief Emmanuel</div>
        <div class="text-sm text-gray-500">Golden Crown Hotel, Lagos</div>
      </div>
      <div class="bg-white rounded-xl p-6 shadow">
        <div class="text-yellow-400 text-xl mb-3">★★★★★</div>
        <p class="text-gray-600 mb-4">"Inventory tracking has reduced our bar losses by 40%. Best decision we made."</p>
        <div class="font-semibold">Mrs. Adebayo</div>
        <div class="text-sm text-gray-500">Royal Suite, Abuja</div>
      </div>
      <div class="bg-white rounded-xl p-6 shadow">
        <div class="text-yellow-400 text-xl mb-3">★★★★★</div>
        <p class="text-gray-600 mb-4">"The power log helped us identify generator inefficiency saving us ₦200k monthly on fuel."</p>
        <div class="font-semibold">Mr. Okonkwo</div>
        <div class="text-sm text-gray-500">Palm Hotel, Enugu</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
  <div class="max-w-4xl mx-auto text-center px-4">
    <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
      Ready to Take Control of Your Hotel?
    </h2>
    <p class="text-xl text-blue-100 mb-8">
      Join hundreds of hotel owners using TOPGAN HMS to stop revenue leakage
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        on:click={() => goto('/dashboard')}
        class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition transform hover:scale-105"
      >
        Start 14-Day Free Trial
      </button>
      <button class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
        Schedule Demo
      </button>
    </div>
  </div>
</section>

<!-- Footer -->
<footer id="contact" class="bg-gray-900 text-white py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid md:grid-cols-4 gap-8">
      <div>
        <div class="text-2xl font-bold mb-4">TOPGAN HMS</div>
        <p class="text-gray-400">Complete hotel management system with real-time audit capabilities.</p>
      </div>
      <div>
        <h3 class="font-semibold mb-3">Product</h3>
        <ul class="space-y-2 text-gray-400">
          <li><a href="#features" class="hover:text-white">Features</a></li>
          <li><a href="#pricing" class="hover:text-white">Pricing</a></li>
          <li><a href="/demo" class="hover:text-white">Demo</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold mb-3">Support</h3>
        <ul class="space-y-2 text-gray-400">
          <li><a href="/docs" class="hover:text-white">Documentation</a></li>
          <li><a href="/support" class="hover:text-white">Support</a></li>
          <li><a href="/contact" class="hover:text-white">Contact</a></li>
        </ul>
      </div>
      <div>
        <h3 class="font-semibold mb-3">Contact</h3>
        <ul class="space-y-2 text-gray-400">
          <li>📧 info@topgan.com</li>
          <li>📞 +234 123 456 7890</li>
          <li>📍 Abuja, Nigeria</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
      <p>&copy; {currentYear} TOPGAN Hotel Management System. All rights reserved.</p>
    </div>
  </div>
</footer>

<style>
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-on-scroll {
    opacity: 0;
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }
</style>