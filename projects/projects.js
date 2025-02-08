import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let query = '';
let selectedIndex = -1; // Persist selected index across updates

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let svg = d3.select('svg');

    // Clear existing paths but keep event listeners
    svg.selectAll('path').remove();

    function updateDisplay() {
        let filteredProjects = projectsGiven;

        if (selectedIndex !== -1) {
            let selectedYear = newData[selectedIndex]?.label;
            filteredProjects = projectsGiven.filter(p => p.year === selectedYear);
        }

        renderProjects(filteredProjects, projectsContainer, 'h2');
    }

    newArcs.forEach((arc, i) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('class', i === selectedIndex ? 'selected-slice' : '')
            .on('click', function () {
                selectedIndex = selectedIndex === i ? -1 : i;
                svg.selectAll('path')
                    .attr('class', (_, idx) => idx === selectedIndex ? 'selected-slice' : '');

                newLegend.selectAll('.swatch')
                    .style('background-color', (_, idx) => idx === selectedIndex ? 'oklch(10% 10% 10)' : colors(idx));

                updateDisplay();
            });
    });

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
                selectedIndex = selectedIndex === idx ? -1 : idx;
                svg.selectAll('path')
                    .attr('class', (_, i) => i === selectedIndex ? 'selected-slice' : '');

                newLegend.selectAll('.swatch')
                    .style('background-color', (_, i) => i === selectedIndex ? 'oklch(10% 10% 10)' : colors(i));

                updateDisplay();
            });
    });

    updateDisplay();
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();

    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderPieChart(filteredProjects); // Preserve selection behavior in new filtered state
});
