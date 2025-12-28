// Lost Weeks DApp - Main Application Logic

let lostData = null;
let currentWeek = 0;
let selectedWeeks = 4;
let selectedYear = 'all'; // 'all', '2025', '2026', or null

// Load JSON data
async function loadData(year = null) {
    try {
        // Determine which JSON file to load
        const yearToLoad = year || selectedYear;
        let filename;
        
        if (yearToLoad === '2025' || yearToLoad === 2025) {
            filename = 'lost-data-2025.json';
        } else if (yearToLoad === '2026' || yearToLoad === 2026) {
            filename = 'lost-data-2026.json';
        } else {
            // Default to 2025 for "all" or initial load
            filename = 'lost-data-2025.json';
        }
        
        // Try to load from current directory first, then try relative path
        let response;
        try {
            response = await fetch(`./${filename}`);
            if (!response.ok) throw new Error('Failed to fetch');
        } catch (e) {
            // Fallback: try without leading dot
            response = await fetch(filename);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        lostData = await response.json();
        
        if (!lostData || !lostData.weeks) {
            throw new Error('Invalid data format');
        }
        
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
        const grid = document.getElementById('eventsGrid');
        const counter = document.getElementById('eventsCounter');
        
        if (grid) {
            grid.innerHTML = `
                <div class="no-events">
                    <p>⚠️ Error loading events data.</p>
                    <p style="font-size: 16px; margin-top: 12px;">${error.message || 'Network error or file not found'}</p>
                    <p style="font-size: 14px; margin-top: 8px;">Please check your connection and refresh the page.</p>
                </div>
            `;
        }
        
        if (counter) {
            counter.textContent = 'Error loading data';
        }
    }
}

// Calculate current week based on data
function calculateCurrentWeek() {
    if (!lostData || !lostData.weeks || lostData.weeks.length === 0) {
        currentWeek = 0;
        return;
    }
    
    // Use the highest week number in the data as current week
    // This ensures we only show weeks that actually have data
    currentWeek = Math.max(...lostData.weeks.map(w => w.weekNumber));
    
    console.log(`Current week calculated: ${currentWeek} (based on data)`);
}

// Filter events from the last X weeks
function getFilteredEvents() {
    if (!lostData || !lostData.weeks || currentWeek === 0) {
        return [];
    }
    
    // Calculate the range: from (currentWeek - selectedWeeks + 1) to currentWeek
    const startWeek = Math.max(1, currentWeek - selectedWeeks + 1);
    const endWeek = currentWeek;
    
    console.log(`Filtering weeks ${startWeek} to ${endWeek} (showing last ${selectedWeeks} weeks)`);
    
    const filteredWeeks = lostData.weeks.filter(week => {
        const weekNum = week.weekNumber;
        return weekNum >= startWeek && weekNum <= endWeek;
    });
    
    console.log(`Found ${filteredWeeks.length} weeks in range`);
    
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
    
    console.log(`Total events found: ${events.length}`);
    
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

// Get all events for a specific year, grouped by month
function getYearEvents(year) {
    if (!lostData || !lostData.weeks) {
        return {};
    }
    
    const yearStr = String(year);
    const eventsByMonth = {};
    let totalEvents = 0;
    
    lostData.weeks.forEach(week => {
        // Extract year from date (format: YYYY-MM-DD)
        const weekYear = week.date ? week.date.substring(0, 4) : null;
        
        if (weekYear === yearStr && week.events && week.events.length > 0) {
            // Extract month from date
            const month = week.date ? week.date.substring(5, 7) : '00';
            const monthKey = `${yearStr}-${month}`;
            
            if (!eventsByMonth[monthKey]) {
                eventsByMonth[monthKey] = [];
            }
            
            week.events.forEach(event => {
                eventsByMonth[monthKey].push({
                    ...event,
                    weekNumber: week.weekNumber,
                    weekDate: week.date,
                    weekTitle: week.title
                });
                totalEvents++;
            });
        }
    });
    
    return { eventsByMonth, totalEvents };
}

// Render year view (list format)
function renderYearView(eventsByMonth, totalEvents) {
    const grid = document.getElementById('eventsGrid');
    
    if (totalEvents === 0) {
        grid.innerHTML = '<div class="no-events">No events found for this year.</div>';
        return;
    }
    
    // Sort months descending (most recent first)
    const monthKeys = Object.keys(eventsByMonth).sort((a, b) => b.localeCompare(a));
    
    const monthNames = {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    
    let html = '<div class="year-view">';
    
    monthKeys.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[month] || `Month ${month}`;
        const events = eventsByMonth[monthKey];
        
        // Sort events by week number (newest first)
        events.sort((a, b) => b.weekNumber - a.weekNumber);
        
        html += `
            <div class="month-group">
                <div class="month-header">
                    <div class="month-title">${monthName} ${year}</div>
                    <div class="month-count">${events.length} event${events.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="events-list">
                    ${events.map(event => createEventListItem(event)).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    grid.innerHTML = html;
}

// Create event list item HTML (compact format)
function createEventListItem(event) {
    const emoji = event.emoji || '📅';
    const title = event.title || 'Untitled Event';
    const description = event.description || '';
    const status = event.status || 'completed';
    const category = event.category || 'general';
    const date = event.weekDate || '';
    
    // Format date for display
    let dateDisplay = '';
    if (date) {
        const dateObj = new Date(date);
        dateDisplay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Status badge class
    const statusClass = status === 'completed' ? 'badge-status' : 
                       status === 'in-progress' ? 'badge-status in-progress' : 
                       'badge-status future';
    
    return `
        <div class="event-item">
            <div class="event-item-emoji">${emoji}</div>
            <div class="event-item-content">
                <div class="event-item-header">
                    <h3 class="event-item-title">${title}</h3>
                    <div class="event-item-badges">
                        <span class="event-item-badge ${statusClass}">${status}</span>
                        <span class="event-item-badge badge-category">${category}</span>
                    </div>
                </div>
                <p class="event-item-description">${description}</p>
                ${dateDisplay ? `<div class="event-item-date">${dateDisplay}</div>` : ''}
            </div>
        </div>
    `;
}

// Update display based on selected weeks or year
function updateDisplay() {
    const grid = document.getElementById('eventsGrid');
    
    // If a specific year is selected, show year view
    if (selectedYear && selectedYear !== 'all') {
        const { eventsByMonth, totalEvents } = getYearEvents(selectedYear);
        renderYearView(eventsByMonth, totalEvents);
        
        // Update year counter
        const yearCounter = document.getElementById('yearCounter');
        if (yearCounter) {
            if (totalEvents === 0) {
                yearCounter.textContent = 'No events found';
            } else {
                yearCounter.textContent = `${totalEvents} event${totalEvents !== 1 ? 's' : ''} in ${selectedYear}`;
            }
        }
        
        // Hide weeks counter
        const counter = document.getElementById('eventsCounter');
        if (counter) {
            counter.textContent = '';
        }
    } else {
        // Show weeks view
        const events = getFilteredEvents();
        renderEvents(events);
        
        // Update counter
        const counter = document.getElementById('eventsCounter');
        if (counter) {
            if (events.length === 0) {
                counter.textContent = 'No events found';
            } else {
                counter.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} found in the last ${selectedWeeks} week${selectedWeeks !== 1 ? 's' : ''}`;
            }
        }
        
        // Update slider value display
        document.getElementById('sliderValue').textContent = selectedWeeks;
        
        // Clear year counter
        const yearCounter = document.getElementById('yearCounter');
        if (yearCounter) {
            yearCounter.textContent = '';
        }
    }
}

// Initialize slider
function initSlider() {
    const slider = document.getElementById('weeksSlider');
    
    slider.addEventListener('input', (e) => {
        if (selectedYear === 'all' || !selectedYear) {
            selectedWeeks = parseInt(e.target.value);
            updateDisplay();
        }
    });
    
    slider.addEventListener('change', (e) => {
        if (selectedYear === 'all' || !selectedYear) {
            selectedWeeks = parseInt(e.target.value);
            updateDisplay();
            // Smooth scroll to top of events
            document.getElementById('eventsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Initialize year selector
function initYearSelector() {
    const yearButtons = document.querySelectorAll('.year-btn');
    
    yearButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const year = btn.getAttribute('data-year');
            
            // Update active state
            yearButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update selected year
            selectedYear = year;
            
            // Enable/disable weeks slider based on selection
            const slider = document.getElementById('weeksSlider');
            const weeksSection = document.getElementById('weeksSection');
            
            if (year === 'all') {
                // Enable weeks selector
                slider.disabled = false;
                weeksSection.style.opacity = '1';
                weeksSection.style.pointerEvents = 'auto';
                
                // Load default data (2025)
                await loadData('2025');
            } else {
                // Disable weeks selector
                slider.disabled = true;
                weeksSection.style.opacity = '0.5';
                weeksSection.style.pointerEvents = 'none';
                
                // Load data for selected year
                await loadData(year);
            }
            
            // Update display
            updateDisplay();
            
            // Smooth scroll to top
            document.getElementById('eventsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initYearSelector();
    loadData();
});

