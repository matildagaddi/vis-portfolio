import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let data = [];

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    //console.log(data);
    processCommits();
    //console.log("Commits after processing:", commits);
    //console.log(commits);
    function displayStats() {
        // Process commits first
        processCommits();
      
        // Create the dl element
        const dl = d3.select('#stats').append('dl').attr('class', 'stats');
      
        // Add total LOC
        dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
        dl.append('dd').text(data.length);
      
        // Add total commits
        dl.append('dt').text('Total commits');
        dl.append('dd').text(commits.length);
      
        // Add number of files
        const fileLengths = d3.rollups(
            data,
            (v) => d3.max(v, (v) => v.line),
            (d) => d.file
          );
        const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
        dl.append('dt').text('Average file length');
        dl.append('dd').text(averageFileLength);

        // time of day work is done
        const workByPeriod = d3.rollups(
            data,
            (v) => v.length,
            (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
          );
        const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
        dl.append('dt').text('Period with most work');
        dl.append('dd').text(maxPeriod);

      }
    displayStats();      
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot();
});


let commits = d3.groups(data, (d) => d.commit);
function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
        });
  
        return ret;
      });
  }

let xScale;
let yScale;

function createScatterplot() {
    const width = 1000;
    const height = 600;
    // num lines edited = size of dots:
    //const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines ?? 1);
    //console.log("Min Lines:", minLines, "Max Lines:", maxLines);
    const rScale = d3.scaleLinear().domain([minLines, maxLines]).range([7, 50]).clamp(true);; // adjust these values based on your experimentation
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();
    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
   
    const dots = svg.append('g').attr('class', 'dots');
    // dots
    //     .selectAll('circle')
    //     .data(commits)
    //     .join('circle')
    //     .attr('cx', (d) => xScale(d.datetime))
    //     .attr('cy', (d) => yScale(d.hourFrac))
    //     .attr('r', 5)
    //     .attr('fill', 'steelblue');
    
    dots
        .selectAll('circle')
        .data(commits)
        .join('circle')
        //.each((d) => console.log('totalLines:', d.totalLines)) // Debugging
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 5)
        .attr('fill', 'steelblue')
        //.each((d) => console.log('Circle data:', d)) // Debugging step
        //.attr('r', (d) => rScale(d.totalLines))
        .attr('r', (d) => rScale(d.totalLines ?? minLines))
        .style('fill-opacity', 0.8) // Add transparency for overlapping dots
        .on('mouseenter', function (event, d, i) {
          //d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
          updateTooltipContent(d);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
          //d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
          updateTooltipContent({});
          updateTooltipVisibility(false);
        });
        

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
      };
      
      // Update scales with new ranges
      xScale.range([usableArea.left, usableArea.right]);
      yScale.range([usableArea.bottom, usableArea.top]);
    
      // Add gridlines BEFORE the axes

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .style('opacity', 0.2);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
      

      // Create the axes
    const xAxis = d3.axisBottom(xScale);
   //const yAxis = d3.axisLeft(yScale);
    // const yAxis = d3
    //     .axisLeft(yScale)
    //     .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);


    brushSelector()
    
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }

// function updateTooltipVisibility(isVisible) {
//     const tooltip = document.getElementById('commit-tooltip');
//     tooltip.hidden = !isVisible;
//   }
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (isVisible) {
      tooltip.style.opacity = 1;
      tooltip.style.visibility = 'visible';
      tooltip.style.pointerEvents = 'auto';
  } else {
      tooltip.style.opacity = 0;
      tooltip.style.visibility = 'hidden';
      tooltip.style.pointerEvents = 'none';
  }
}

// function updateTooltipPosition(event) {
//   const tooltip = document.getElementById('commit-tooltip');
//   tooltip.style.left = `${event.clientX}px`;
//   tooltip.style.top = `${event.clientY}px`;
// }
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`; // Add offset to prevent flickering
  tooltip.style.top = `${event.clientY + 10}px`;
}

function brushSelector() {
  const svg = document.querySelector('svg');
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
  

}

let brushSelection = null;

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

// function isCommitSelected(commit) {
//   if (!brushSelection) {
//     return false;
//   }
//   else {return true;}
//   // TODO: return true if commit is within brushSelection
//   // and false if not
// }

// function isCommitSelected(commit) { 
//   if (!brushSelection) return false; 
//   const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
//   const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
//   const x = xScale(commit.date); const y = yScale(commit.hourFrac); 
//   return x >= min.x && x <= max.x && y >= min.y && y <= max.y; }

  function isCommitSelected(commit) { 
    if (!brushSelection) return false; 
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
    const x = xScale(commit.date); 
    const y = yScale(commit.hourFrac); 
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 
  }

function updateSelection() {
  // Update visual state of dots based on selection
  //console.log("Updating selection...");
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}