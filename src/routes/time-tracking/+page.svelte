<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	// Using native URLSearchParams for form data
	import {
		Clock,
		Calendar,
		MapPin,
		CheckCircle2,
		AlertCircle,
		TrendingUp,
		Briefcase,
		Award,
		Timer,
		Play,
		Square,
		Edit2,
		Users,
		Search,
		Filter,
		User,
		Mail,
		Phone,
		X,
		Building,
		Coffee,
		Store,
		ChefHat,
		Home,
		ChevronRight
	} from 'lucide-svelte';

	let { data } = $props();

	let user = $derived(data.user);
	let todayActivity = $derived(data.todayActivity);
	let history = $derived(data.history);
	let stats = $derived(data.stats);
	let needsTracking = $derived(data.needsTracking);
	let isAdmin = $derived(data.isAdmin);
	let allStaffActivity = $derived(data.allStaffActivity || []);

	let showNotesModal = $state(false);
	let showLocationModal = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let selectedActivity: any = $state(null);
	let notes = $state('');
	let clockingIn = $state(false);
	let clockingOut = $state(false);
	let activeTab = $state('personal');
	let searchStaff = $state('');
	let errorMessage = $state('');
	let selectedLocation = $state('');

	// Predefined locations within the hotel
	const locations = [
		{
			id: 'main_building',
			name: 'Main Building',
			icon: Building,
			address: 'Main Lobby, Ground Floor'
		},
		{ id: 'front_desk', name: 'Front Desk', icon: Home, address: 'Reception Area' },
		{ id: 'bar', name: 'Bar', icon: Coffee, address: 'Bar & Lounge Area' },
		{ id: 'kitchen', name: 'Kitchen', icon: ChefHat, address: 'Main Kitchen' },
		{ id: 'store', name: 'Store Room', icon: Store, address: 'Inventory Storage' },
		{
			id: 'housekeeping',
			name: 'Housekeeping',
			icon: Building,
			address: 'Housekeeping Department'
		},
		{ id: 'maintenance', name: 'Maintenance', icon: Building, address: 'Maintenance Workshop' },
		{ id: 'security', name: 'Security Post', icon: Building, address: 'Security Gate House' }
	];

	// Helper function to get location icon component
	function getLocationIcon(locationName: string) {
		const location = locations.find((l) => l.name === locationName);
		if (location) return location.icon;
		return MapPin;
	}

	let filteredStaffActivity = $derived(
		allStaffActivity.filter((activity) =>
			activity.userName?.toLowerCase().includes(searchStaff.toLowerCase())
		)
	);

	function openLocationModal() {
		selectedLocation = '';
		showLocationModal = true;
	}

	// Replace the existing handleClockInWithLocation function with:
	async function handleClockInWithLocation() {
		if (!selectedLocation) {
			alert('Please select a location');
			return;
		}

		const locationObj = locations.find((l) => l.id === selectedLocation);
		const locationName = locationObj?.name || selectedLocation;

		clockingIn = true;
		errorMessage = '';

		const formData = new FormData();
		formData.append('location', locationName);

		try {
			const response = await fetch('/api/clock/in', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				showLocationModal = false;
				window.location.reload();
			} else {
				errorMessage = result.error || 'Failed to clock in';
				alert(errorMessage);
			}
		} catch (err) {
			errorMessage = 'Failed to clock in';
			alert(errorMessage);
		} finally {
			clockingIn = false;
		}
	}

	// Replace the existing handleClockOut function with:
	async function handleClockOut() {
		if (clockingOut) return;
		clockingOut = true;
		errorMessage = '';

		if (confirm('Are you sure you want to clock out?')) {
			try {
				const response = await fetch('/api/clock/out', {
					method: 'POST'
				});

				const result = await response.json();

				if (response.ok && result.success) {
					window.location.reload();
				} else {
					errorMessage = result.error || 'Failed to clock out';
					alert(errorMessage);
				}
			} catch (err) {
				errorMessage = 'Failed to clock out';
				alert(errorMessage);
			} finally {
				clockingOut = false;
			}
		} else {
			clockingOut = false;
		}
	}

	// Optional: Add a function to check current status
	async function checkClockStatus() {
		try {
			const response = await fetch('/api/clock/status');
			const result = await response.json();
			if (result.success) {
				console.log('Clock status:', result.data);
			}
		} catch (err) {
			console.error('Failed to get status:', err);
		}
	}

	async function handleUpdateNotes() {
		if (!selectedActivity) return;

		const formData = new URLSearchParams();
		formData.append('activityId', selectedActivity.id);
		formData.append('notes', notes);

		const response = await fetch('?/updateNotes', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: formData.toString()
		});

		if (response.ok) {
			showNotesModal = false;
			window.location.reload();
		} else {
			alert('Failed to update notes');
		}
	}

	function formatTime(date: Date | string | null) {
		if (!date) return '--:--';
		return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(date: Date | string | null) {
		if (!date) return '';
		return new Date(date).toLocaleDateString([], {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function getShiftStatus(activity: any) {
		if (!activity.checkOut)
			return { label: 'Active', color: 'text-emerald-600 bg-emerald-50', icon: Play };
		return { label: 'Completed', color: 'text-slate-500 bg-slate-50', icon: CheckCircle2 };
	}

	function getRoleBadge(role: string) {
		const colors: Record<string, string> = {
			general_manager: 'bg-blue-100 text-blue-700',
			front_desk_manager: 'bg-emerald-100 text-emerald-700',
			store_keeper: 'bg-amber-100 text-amber-700',
			cleaner: 'bg-teal-100 text-teal-700',
			staff: 'bg-slate-100 text-slate-700'
		};
		return colors[role] || 'bg-slate-100 text-slate-700';
	}
</script>

<div class="min-h-screen bg-slate-50/50 p-8">
	<div class="mx-auto max-w-7xl">
		<header class="mb-8">
			<h1 class="text-3xl font-black tracking-tight text-slate-900">Time Tracking</h1>
			<p class="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
				{#if !needsTracking}
					Administrator View - Monitor Staff Attendance
				{:else}
					Clock In/Out & Shift Management
				{/if}
			</p>
		</header>

		<!-- Owner/Super Admin Message -->
		{#if !needsTracking}
			<div class="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
				<div class="flex items-center gap-2">
					<AlertCircle size={18} class="text-indigo-600" />
					<span class="font-black text-indigo-800">Administrator Access</span>
				</div>
				<p class="mt-1 text-sm text-indigo-700">
					As an owner or super admin, you are not required to clock in/out. This page allows you to
					monitor staff attendance.
				</p>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
				<p class="text-sm text-rose-700">{errorMessage}</p>
			</div>
		{/if}

		<!-- Tabs for Admin View -->
		{#if isAdmin}
			<div class="mb-8 flex gap-2 border-b border-slate-200">
				<button
					onclick={() => (activeTab = 'personal')}
					class="px-6 py-3 text-sm font-black transition-all {activeTab === 'personal'
						? 'border-b-2 border-indigo-600 text-indigo-600'
						: 'text-slate-400 hover:text-slate-600'}"
				>
					<div class="flex items-center gap-2">
						<User size={16} />
						My Time Tracking
					</div>
				</button>
				<button
					onclick={() => (activeTab = 'staff')}
					class="px-6 py-3 text-sm font-black transition-all {activeTab === 'staff'
						? 'border-b-2 border-indigo-600 text-indigo-600'
						: 'text-slate-400 hover:text-slate-600'}"
				>
					<div class="flex items-center gap-2">
						<Users size={16} />
						Staff Attendance
					</div>
				</button>
			</div>
		{/if}

		<!-- Personal Time Tracking -->
		{#if (!isAdmin && needsTracking) || (isAdmin && activeTab === 'personal')}
			{#if needsTracking}
				<!-- Stats Overview for regular users -->
				<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
					<div class="rounded-2xl border border-slate-100 bg-white p-5">
						<div class="mb-3 flex items-center justify-between">
							<div class="rounded-lg bg-indigo-50 p-2">
								<Timer size={18} class="text-indigo-600" />
							</div>
						</div>
						<p class="text-[10px] font-black text-slate-400 uppercase">Total Hours (Month)</p>
						<p class="text-2xl font-black text-slate-900">{stats.totalHoursThisMonth} hrs</p>
					</div>

					<div class="rounded-2xl border border-slate-100 bg-white p-5">
						<div class="mb-3 w-fit rounded-lg bg-emerald-50 p-2">
							<Briefcase size={18} class="text-emerald-600" />
						</div>
						<p class="text-[10px] font-black text-slate-400 uppercase">Total Shifts</p>
						<p class="text-2xl font-black text-slate-900">{stats.totalShifts}</p>
					</div>

					<div class="rounded-2xl border border-slate-100 bg-white p-5">
						<div class="mb-3 w-fit rounded-lg bg-amber-50 p-2">
							<TrendingUp size={18} class="text-amber-600" />
						</div>
						<p class="text-[10px] font-black text-slate-400 uppercase">Avg Hours/Shift</p>
						<p class="text-2xl font-black text-slate-900">{stats.averageHours} hrs</p>
					</div>

					<div class="rounded-2xl border border-slate-100 bg-white p-5">
						<div class="mb-3 w-fit rounded-lg bg-purple-50 p-2">
							<Award size={18} class="text-purple-600" />
						</div>
						<p class="text-[10px] font-black text-slate-400 uppercase">Completed Shifts</p>
						<p class="text-2xl font-black text-slate-900">{stats.completedShifts}</p>
					</div>
				</div>
			{/if}

			<!-- Today's Shift Card -->
			<div class="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white">
				<div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
					<h2 class="flex items-center gap-2 text-lg font-black text-white">
						<Clock size={20} />
						{needsTracking ? "Today's Shift" : 'Shift Information'}
					</h2>
				</div>

				<div class="p-6">
					{#if needsTracking && todayActivity}
						<div
							class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
						>
							<div class="flex items-center gap-6">
								<div>
									<p class="text-[10px] font-black text-slate-400 uppercase">Clock In</p>
									<p class="text-2xl font-black text-slate-900">
										{formatTime(todayActivity.checkIn)}
									</p>
									<p class="text-xs text-slate-500">{formatDate(todayActivity.checkIn)}</p>
								</div>

								{#if todayActivity.checkOut}
									<div class="h-12 w-px bg-slate-200"></div>
									<div>
										<p class="text-[10px] font-black text-slate-400 uppercase">Clock Out</p>
										<p class="text-2xl font-black text-slate-900">
											{formatTime(todayActivity.checkOut)}
										</p>
										<p class="text-xs text-slate-500">{formatDate(todayActivity.checkOut)}</p>
									</div>

									<div class="h-12 w-px bg-slate-200"></div>
									<div>
										<p class="text-[10px] font-black text-slate-400 uppercase">Hours Worked</p>
										<p class="text-2xl font-black text-emerald-600">
											{todayActivity.hoursWorked} hrs
										</p>
									</div>
								{/if}
							</div>

							<div class="flex gap-3">
								{#if !todayActivity.checkOut && needsTracking}
									<button
										onclick={handleClockOut}
										disabled={clockingOut}
										class="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-black text-white transition-all hover:bg-rose-700 disabled:opacity-50"
									>
										<Square size={18} />
										{clockingOut ? 'Processing...' : 'Clock Out'}
									</button>
								{/if}

								<button
									onclick={() => {
										selectedActivity = todayActivity;
										notes = todayActivity.notes || '';
										showNotesModal = true;
									}}
									class="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-black text-slate-700 transition-all hover:bg-slate-200"
								>
									<Edit2 size={16} />
									Add Notes
								</button>
							</div>
						</div>

						{#if todayActivity.location}
							{@const LocationIcon = getLocationIcon(todayActivity.location)}
							<div
								class="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500"
							>
								<LocationIcon size={14} />
								<span>Location: {todayActivity.location}</span>
							</div>
						{/if}

						{#if todayActivity.notes}
							<div class="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
								<span class="font-bold">Notes:</span>
								{todayActivity.notes}
							</div>
						{/if}
					{:else if needsTracking}
						<div class="py-8 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
							>
								<Clock size={28} class="text-slate-400" />
							</div>
							<p class="mb-4 text-slate-500">Not clocked in yet today</p>
							<button
								onclick={openLocationModal}
								disabled={clockingIn}
								class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
							>
								<MapPin size={18} />
								{clockingIn ? 'Processing...' : 'Clock In'}
							</button>
						</div>
					{:else}
						<div class="py-8 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
							>
								<Clock size={28} class="text-slate-400" />
							</div>
							<p class="text-slate-500">No time tracking data available for your account</p>
							<p class="mt-2 text-xs text-slate-400">
								As an administrator, you are not required to clock in/out
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- History Section (only for users who need tracking) -->
			{#if needsTracking && history.length > 0}
				<div>
					<div class="mb-6 flex items-center justify-between">
						<h2 class="flex items-center gap-2 text-xl font-black text-slate-800">
							<Calendar size={20} />
							Shift History
						</h2>
						<p class="text-xs text-slate-400">Last 30 shifts</p>
					</div>

					<div class="space-y-3">
						{#each history as shift (shift.id)}
							{@const status = getShiftStatus(shift)}
							{@const LocationIcon = getLocationIcon(shift.location)}
							<div
								class="rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md"
							>
								<div
									class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
								>
									<div class="flex items-center gap-4">
										<div
											class="h-10 w-10 {status.color} flex items-center justify-center rounded-xl"
										>
											<status.icon size={18} />
										</div>
										<div>
											<p class="font-black text-slate-900">{formatDate(shift.createdAt)}</p>
											<div class="mt-1 flex items-center gap-3">
												<span class="text-xs font-bold text-slate-500">
													In: {formatTime(shift.checkIn)}
												</span>
												{#if shift.checkOut}
													<span class="text-xs font-bold text-slate-500">
														Out: {formatTime(shift.checkOut)}
													</span>
												{/if}
											</div>
										</div>
									</div>

									<div class="flex items-center gap-4">
										{#if shift.hoursWorked}
											<div class="text-right">
												<p class="text-[10px] font-black text-slate-400 uppercase">Hours</p>
												<p class="text-lg font-black text-emerald-600">{shift.hoursWorked} hrs</p>
											</div>
										{/if}

										{#if !shift.checkOut}
											<span
												class="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"
											>
												Active
											</span>
										{/if}

										<button
											onclick={() => {
												selectedActivity = shift;
												notes = shift.notes || '';
												showNotesModal = true;
											}}
											class="rounded-lg p-2 transition-colors hover:bg-slate-100"
										>
											<Edit2 size={16} class="text-slate-400" />
										</button>
									</div>
								</div>

								{#if shift.location}
									<div
										class="mt-3 flex items-center gap-2 border-t border-slate-50 pt-3 text-xs text-slate-400"
									>
										<LocationIcon size={12} />
										<span>{shift.location}</span>
									</div>
								{/if}

								{#if shift.notes}
									<div class="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
										📝 {shift.notes}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<!-- Staff Attendance View (Admin only) -->
		{#if isAdmin && activeTab === 'staff'}
			<div>
				<div class="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
					<div class="relative">
						<Search size={18} class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							bind:value={searchStaff}
							placeholder="Search staff by name..."
							class="w-full rounded-xl bg-slate-50 py-3 pr-4 pl-10 text-sm font-bold"
						/>
					</div>
				</div>

				<div class="space-y-3">
					{#if filteredStaffActivity.length === 0}
						<div
							class="rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center"
						>
							<Users size={48} class="mx-auto mb-4 text-slate-200" />
							<p class="font-black tracking-widest text-slate-400 uppercase">
								No staff clocked in today
							</p>
						</div>
					{:else}
						{#each filteredStaffActivity as activity (activity.id)}
							{@const LocationIcon = getLocationIcon(activity.location)}
							<div
								class="rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md"
							>
								<div
									class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
								>
									<div class="flex items-center gap-4">
										<div
											class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-lg font-black text-white"
										>
											{activity.userName?.charAt(0) || 'U'}
										</div>
										<div>
											<p class="text-lg font-black text-slate-900">{activity.userName}</p>
											<div class="mt-1 flex items-center gap-2">
												<span
													class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-black {getRoleBadge(
														activity.userRole
													)}"
												>
													<Briefcase size={8} />
													{activity.userRole?.replace(/_/g, ' ')}
												</span>
												<span class="text-xs text-slate-400">{activity.userStaffId}</span>
											</div>
										</div>
									</div>

									<div class="flex items-center gap-6">
										<div>
											<p class="text-[10px] font-black text-slate-400 uppercase">Clock In</p>
											<p class="text-lg font-black text-slate-900">
												{formatTime(activity.checkIn)}
											</p>
										</div>

										{#if activity.checkOut}
											<div>
												<p class="text-[10px] font-black text-slate-400 uppercase">Clock Out</p>
												<p class="text-lg font-black text-slate-900">
													{formatTime(activity.checkOut)}
												</p>
											</div>
											<div>
												<p class="text-[10px] font-black text-slate-400 uppercase">Hours</p>
												<p class="text-lg font-black text-emerald-600">
													{activity.hoursWorked} hrs
												</p>
											</div>
										{:else}
											<div class="rounded-xl bg-emerald-50 px-3 py-2">
												<p class="flex items-center gap-1 text-xs font-black text-emerald-700">
													<Play size={10} />
													Active Now
												</p>
											</div>
										{/if}
									</div>
								</div>

								{#if activity.location}
									<div
										class="mt-3 flex items-center gap-2 border-t border-slate-50 pt-3 text-xs text-slate-400"
									>
										<LocationIcon size={12} />
										<span>{activity.location}</span>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Location Selection Modal -->
{#if showLocationModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
	>
		<div class="w-full max-w-md rounded-3xl bg-white">
			<div class="border-b border-slate-100 p-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-black text-slate-900">Select Location</h2>
						<p class="text-sm text-slate-500">Choose where you are clocking in from</p>
					</div>
					<button
						onclick={() => (showLocationModal = false)}
						class="rounded-xl p-2 hover:bg-slate-100"
					>
						<X size={20} />
					</button>
				</div>
			</div>

			<div class="space-y-3 p-6">
				{#each locations as location (location.id)}
					<button
						onclick={() => {
							selectedLocation = location.id;
							handleClockInWithLocation();
						}}
						class="group flex w-full items-center gap-4 rounded-xl bg-slate-50 p-4 transition-all hover:bg-indigo-50"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 transition-colors group-hover:bg-indigo-500 group-hover:text-white"
						>
							<location.icon size={20} />
						</div>
						<div class="flex-1 text-left">
							<p class="font-black text-slate-800 group-hover:text-indigo-600">{location.name}</p>
							<p class="text-[10px] text-slate-400 group-hover:text-indigo-400">
								{location.address}
							</p>
						</div>
						<div class="text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
							<ChevronRight size={20} />
						</div>
					</button>
				{/each}
			</div>

			<div class="border-t border-slate-100 p-6">
				<button
					onclick={() => (showLocationModal = false)}
					class="w-full rounded-xl bg-slate-100 px-4 py-3 font-black text-slate-600"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Notes Modal -->
{#if showNotesModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
	>
		<div class="w-full max-w-md rounded-3xl bg-white">
			<div class="border-b border-slate-100 p-6">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-black text-slate-900">Add Notes</h2>
						<p class="text-sm text-slate-500">Add notes to your shift</p>
					</div>
					<button
						onclick={() => (showNotesModal = false)}
						class="rounded-xl p-2 hover:bg-slate-100"
					>
						<X size={20} />
					</button>
				</div>
			</div>

			<div class="p-6">
				<textarea
					bind:value={notes}
					rows="4"
					class="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
					placeholder="Enter any notes about your shift..."
				></textarea>
			</div>

			<div class="flex gap-3 border-t border-slate-100 p-6">
				<button
					onclick={() => (showNotesModal = false)}
					class="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-black text-slate-600"
				>
					Cancel
				</button>
				<button
					onclick={handleUpdateNotes}
					class="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-black text-white"
				>
					Save Notes
				</button>
			</div>
		</div>
	</div>
{/if}
