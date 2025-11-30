// Lost Weeks DApp - Main Application Logic

let lostData = null;
let currentWeek = 0;
let selectedWeeks = 4;

// Load JSON data
async function loadData() {
    try {
        const response = await fetch('lost-data.json');
        lostData = await response.json();
        
        // Calculate current week based on start date
        calculateCurrentWeek();
        
        // Initialize slider max value
        const slider = document.getElementById('weeksSlider');
        const maxWeeks = Math.min(currentWeek, 52);
        slider.max = maxWeeks;
        if (selectedWeeks > maxWeeks) {
            selectedWeeks = maxWeeks;
            slider.value = maxWeeks;
        }
        
        // Initial render
        updateDisplay();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('eventsGrid').innerHTML = '<div class="no-events">Error loading events data. Please refresh the page.</div>';
    }
}

// Calculate current week based on start date
function calculateCurrentWeek() {
    if (!lostData || !lostData.startDate) {
        // Fallback: use the highest week number in data
        currentWeek = Math.max(...lostData.weeks.map(w => w.weekNumber));
        return;
    }
    
    const startDate = new Date(lostData.startDate);
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Use the maximum between calculated and data weeks
    const maxDataWeek = Math.max(...lostData.weeks.map(w => w.weekNumber));
    currentWeek = Math.max(diffWeeks, maxDataWeek);
}

// Filter events from the last X weeks
function getFilteredEvents() {
    if (!lostData || !lostData.weeks) {
        return [];
    }
    
    const startWeek = Math.max(1, currentWeek - selectedWeeks + 1);
    const endWeek = currentWeek;
    
    const filteredWeeks = lostData.weeks.filter(week => {
        return week.weekNumber >= startWeek && week.weekNumber <= endWeek;
    });
    
    // Flatten events from all filtered weeks
    const events = [];
    filteredWeeks.forEach(week => {
        if (week.events && week.events.length > 0) {
            week.events.forEach(event => {
                events.push({
                    ...event,
                    weekNumber: week.weekNumber,
                    weekDate: week.date,
                    weekTitle: week.title
                });
            });
        }
    });
    
    return events;
}

// Render event cards
function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    
    if (events.length === 0) {
        grid.innerHTML = '<div class="no-events">No events found in the selected time period.</div>';
        return;
    }
    
    // Sort events by week number (newest first)
    events.sort((a, b) => b.weekNumber - a.weekNumber);
    
    grid.innerHTML = events.map((event, index) => {
        return createEventCard(event, index);
    }).join('');
    
    // Trigger animations
    setTimeout(() => {
        const cards = document.querySelectorAll('.event-card');
        cards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 100);
}

// Create event card HTML
function createEventCard(event, index) {
    const emoji = event.emoji || '📅';
    const title = event.title || 'Untitled Event';
    const description = event.description || '';
    const status = event.status || 'completed';
    const category = event.category || 'general';
    
    // Status badge
    const statusBadge = `<span class="badge badge-status ${status}">${status}</span>`;
    
    // Category badge
    const categoryBadge = `<span class="badge badge-category">${category}</span>`;
    
    // Stats
    let statsHTML = '';
    if (event.stats) {
        const statsArray = [];
        if (event.stats.minted) statsArray.push(`${event.stats.minted} minted`);
        if (event.stats.sold) statsArray.push(`${event.stats.sold} sold`);
        if (event.stats.price) statsArray.push(`Price: ${event.stats.price}`);
        if (event.stats.highestBid) statsArray.push(`Highest bid: ${event.stats.highestBid}`);
        if (event.stats.collected) statsArray.push(`Collected: ${event.stats.collected}`);
        if (event.stats.distributed) statsArray.push(`Distributed: ${event.stats.distributed}`);
        if (event.stats.allowlisted) statsArray.push(`${event.stats.allowlisted} allowlisted`);
        if (event.stats.holders) statsArray.push(`${event.stats.holders} holders`);
        if (event.stats.newHolders) statsArray.push(`${event.stats.newHolders} new holders`);
        if (event.stats.traits) statsArray.push(`${event.stats.traits} traits`);
        if (event.stats.contracts) statsArray.push(`${event.stats.contracts} contracts`);
        if (event.stats.providers) statsArray.push(`${event.stats.providers} providers`);
        if (event.stats.funded) statsArray.push(`Funded: ${event.stats.funded}`);
        if (event.stats.farmed) statsArray.push(`Farmed: ${event.stats.farmed}`);
        if (event.stats.mints) statsArray.push(`${event.stats.mints} mints`);
        if (event.stats.newWallets) statsArray.push(`${event.stats.newWallets} new wallets`);
        if (event.stats.claimed) statsArray.push(`${event.stats.claimed} claimed`);
        if (event.stats.winners) statsArray.push(`${event.stats.winners} winners`);
        if (event.stats.ticketsSold) statsArray.push(`${event.stats.ticketsSold} tickets`);
        if (event.stats.totalSupply) statsArray.push(`Supply: ${event.stats.totalSupply}`);
        if (event.stats.unique1of1) statsArray.push(`${event.stats.unique1of1} unique 1/1s`);
        if (event.stats.boostedOdds) statsArray.push(`Boosted odds: ${event.stats.boostedOdds}`);
        if (event.stats.prebuiltZeros) statsArray.push(`${event.stats.prebuiltZeros} prebuilt ZEROS`);
        if (event.stats.newTraits) statsArray.push(`${event.stats.newTraits} new traits`);
        if (event.stats.itemsCreated) statsArray.push(`${event.stats.itemsCreated} items created`);
        if (event.stats.time) statsArray.push(`Time: ${event.stats.time}`);
        if (event.stats.reward) statsArray.push(`Reward: ${event.stats.reward}`);
        
        if (statsArray.length > 0) {
            statsHTML = `<div class="event-stats">${statsArray.join(' • ')}</div>`;
        }
    }
    
    // Links
    let linksHTML = '';
    if (event.links && event.links.length > 0) {
        linksHTML = '<div class="event-links">' + 
            event.links.map(link => 
                `<a href="${link.url}" target="_blank" class="event-link">${link.text}</a>`
            ).join('') + 
            '</div>';
    }
    
    return `
        <div class="event-card" style="animation-delay: ${index * 0.1}s">
            <div class="event-emoji">${emoji}</div>
            <div class="event-title">${title}</div>
            <div class="event-description">${description}</div>
            <div class="event-badges">
                ${statusBadge}
                ${categoryBadge}
            </div>
            ${statsHTML}
            ${linksHTML}
        </div>
    `;
}

// Update display based on selected weeks
function updateDisplay() {
    const events = getFilteredEvents();
    renderEvents(events);
    
    // Update counter
    const counter = document.getElementById('eventsCounter');
    if (events.length === 0) {
        counter.textContent = 'No events found';
    } else {
        counter.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found in the last ${selectedWeeks} week${selectedWeeks !== 1 ? 's' : ''}`;
    }
    
    // Update slider value display
    document.getElementById('sliderValue').textContent = selectedWeeks;
}

// Initialize slider
function initSlider() {
    const slider = document.getElementById('weeksSlider');
    
    slider.addEventListener('input', (e) => {
        selectedWeeks = parseInt(e.target.value);
        updateDisplay();
    });
    
    slider.addEventListener('change', (e) => {
        selectedWeeks = parseInt(e.target.value);
        updateDisplay();
        // Smooth scroll to top of events
        document.getElementById('eventsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    loadData();
});

