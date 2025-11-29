/**
 * Chart rendering for the Lottery Generator
 */

/**
 * Render the frequency chart
 * @param {Array} winningNumbers - Historical winning numbers
 * @param {Array} bonusNumbers - Historical bonus numbers
 */
function renderChart(winningNumbers = [], bonusNumbers = []) {
    const ctx = document.getElementById('frequencyChart');
    if (!ctx) return;

    // Calculate frequency
    const frequency = Array(CONFIG.TOTAL_NUMBERS + 1).fill(0); // Index 0 unused
    const bonusFrequency = Array(CONFIG.TOTAL_NUMBERS + 1).fill(0);
    const firstNumFrequency = Array(CONFIG.TOTAL_NUMBERS + 1).fill(0);

    winningNumbers.forEach(draw => {
        if (Array.isArray(draw) && draw.length > 0) {
            // Main Frequency
            draw.forEach(num => {
                if (num >= 1 && num <= CONFIG.TOTAL_NUMBERS) {
                    frequency[num]++;
                }
            });

            // First Number Frequency (Start Number)
            // Use the first number as is, assuming data preserves extraction order if available
            // If data is already sorted (like current winning_numbers.js), this will still be the smallest number.
            const firstNum = draw[0];
            if (firstNum >= 1 && firstNum <= CONFIG.TOTAL_NUMBERS) {
                firstNumFrequency[firstNum]++;
            }
        }
    });

    bonusNumbers.forEach(num => {
        if (num >= 1 && num <= CONFIG.TOTAL_NUMBERS) {
            bonusFrequency[num]++;
        }
    });

    // Prepare data for Chart.js
    const labels = [];
    const data = [];
    const bonusData = [];
    const firstNumData = [];
    const backgroundColors = [];
    const borderColors = [];

    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        labels.push(i);
        data.push(frequency[i]);
        bonusData.push(bonusFrequency[i]);
        firstNumData.push(firstNumFrequency[i]);

        // Color based on range
        const range = CONFIG.RANGES.find(r => i <= r.max);
        if (range) {
            const color = range.color;
            // Convert hex to rgba
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            backgroundColors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
            borderColors.push(`rgba(${r}, ${g}, ${b}, 1)`);
        } else {
            backgroundColors.push('rgba(76, 209, 55, 0.6)');
            borderColors.push('rgba(76, 209, 55, 1)');
        }
    }

    new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Main Numbers',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    order: 3,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Bonus Numbers',
                    data: bonusData,
                    backgroundColor: 'rgba(45, 52, 54, 0.2)',
                    borderColor: 'rgba(45, 52, 54, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(45, 52, 54, 1)',
                    pointRadius: 3,
                    tension: 0.4, // Smooth curve
                    order: 2,
                    yAxisID: 'y1'
                },
                {
                    type: 'line',
                    label: 'Start Number Frequency',
                    data: firstNumData,
                    backgroundColor: 'rgba(155, 89, 182, 0.2)', // Purple
                    borderColor: 'rgba(155, 89, 182, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(155, 89, 182, 1)',
                    pointRadius: 3,
                    tension: 0.4,
                    order: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Main Frequency'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                    title: {
                        display: true,
                        text: 'Bonus / Start Frequency'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Number'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Winning Number Frequency (Main vs Bonus vs Start)'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Make chart function available globally
window.renderChart = renderChart;
