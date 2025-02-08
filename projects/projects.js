import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function renderPieChart(projectsGiven) {
    // Re-calculate rolled data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    // Transform data into required format
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Generate pie slices
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let svg = d3.select('svg');

    // Clear existing elements
    svg.selectAll('path').remove();

    let selectedIndex = -1; // Track selected index

    function updateDisplay() {
        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2'); // Show all projects
        } else {
            let selectedYear = newData[selectedIndex].label;
            let filteredProjects = projects.filter(p => p.year === selectedYear);
            renderProjects(filteredProjects, projectsContainer, 'h2'); // Show filtered projects
        }
    }

    // Draw pie chart
    newArcs.forEach((arc, i) => {
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .on('click', function () {
                selectedIndex = selectedIndex === i ? -1 : i; // Toggle selection

                // Update pie slices
                svg.selectAll('path')
                    .attr('class', (_, idx) => idx === selectedIndex ? 'selected-slice' : '');

                // Update legend swatch color
                newLegend.selectAll('.swatch')
                    .style('background-color', (_, idx) => idx === selectedIndex ? 'oklch(10% 10% 10)' : colors(idx));

                // Update project display
                updateDisplay();
            });
    });

    // Create legend
    let newLegend = d3.select('.legend');
    newLegend.selectAll('li').remove();

    newData.forEach((d, idx) => {
        newLegend.append('li')
            .attr('class', 'legend-item')
            .html(`
                <span class="swatch" style="background-color: ${colors(idx)}"></span>
                <span class="legend-text">${d.label} <em>(${d.value})</em></span>
            `)
            .on('click', function () {
                selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selection

                // Update pie slices
                svg.selectAll('path')
                    .attr('class', (_, i) => i === selectedIndex ? 'selected-slice' : '');

                // Update legend swatch color
                newLegend.selectAll('.swatch')
                    .style('background-color', (_, i) => i === selectedIndex ? 'oklch(10% 10% 10)' : colors(i));

                // Update project display
                updateDisplay();
            });
    });

    // Initial display of projects
    updateDisplay();
}

  
// Call this function on page load
renderPieChart(projects);



let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // TODO: render updated projects!
  renderProjects(filteredProjects, projectsContainer, 'h2');

  // update pie chart
  renderPieChart(filteredProjects);
});


