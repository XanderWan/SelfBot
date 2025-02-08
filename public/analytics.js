// Bar Chart for User Activity
export async function renderUserActivity(tooltip) {
    let data = await d3.json('/api/stats/user-activity');
    data = data.sort((a, b) => b.messageCount - a.messageCount).slice(0, 10);

    const margin = {top: 30, right: 30, bottom: 60, left: 50};
    const width = 560 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#userActivityChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "barGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#3b82f6")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#60a5fa")
        .attr("stop-opacity", 0.8);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .range([height, 0]);

    x.domain(data.map(d => d.username));
    y.domain([0, d3.max(data, d => d.messageCount)]);

    // X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickSize(-width)
        )
        .call(g => g.select(".domain").remove());

    // Bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.username))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.messageCount))
        .attr("height", d => height - y(d.messageCount))
        .attr("rx", 4)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`<strong>${d.username}</strong><br>${d.messageCount} messages`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Pie Chart for Mentions with gradients
export async function renderMentions(tooltip) {
    const data = await d3.json('/api/stats/mentions');

    const width = 560;
    const height = 400;
    const radius = Math.min(width, height) / 2.5;

    const svg = d3.select("#mentionsChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Define gradients for pie slices
    const defs = svg.append("defs");
    const colors = d3.schemeSet3;

    data.forEach((d, i) => {
        const gradient = defs.append("linearGradient")
            .attr("id", `pieGradient${i}`)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colors[i])
            .attr("stop-opacity", 1);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.color(colors[i]).darker(0.5))
            .attr("stop-opacity", 0.8);
    });

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius);

    const arcs = svg.selectAll("arc")
        .data(pie(data))
        .enter()
        .append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => `url(#pieGradient${i})`)
        .attr("class", "pie-slice")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`<strong>ID: ${d.data.id}</strong><br>${d.data.count} mentions`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Line Chart for Time Activity with gradient
export async function renderTimeActivity(tooltip) {
    const data = await d3.json('/api/stats/time-activity');

    const margin = {top: 30, right: 30, bottom: 40, left: 50};
    const width = 560 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#timeActivityChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "lineGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#0ea5e9")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#7dd3fc")
        .attr("stop-opacity", 0.8);

    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => {
        d.date = parseDate(d.date);
    });

    const x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, d => d.date));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.count)]);

    // Add X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(5))
        .call(g => g.select(".domain").remove());

    // Add the line
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    // Add dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`<strong>${d3.timeFormat("%Y-%m-%d")(d.date)}</strong><br>${d.count} messages`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Content Analysis with horizontal bars and gradient
export async function renderContentAnalysis(tooltip) {
    let data = await d3.json('/api/stats/content-analysis');
    data = data.slice(0, 10); // Top 10 words

    const margin = {top: 30, right: 30, bottom: 40, left: 120};
    const width = 560 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#contentAnalysisChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define gradient
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "horizontalBarGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#8b5cf6")
        .attr("stop-opacity", 1);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#a78bfa")
        .attr("stop-opacity", 0.8);

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, d => d.count)]);

    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.word))
        .padding(0.2);

    // Add X axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .call(g => g.select(".domain").remove());

    // Add Y axis
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove());

    // Add bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.word))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", d => x(d.count))
        .attr("fill", "url(#horizontalBarGradient)")
        .attr("rx", 4) // Rounded corners
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`<strong>${d.word}</strong><br>${d.count} occurrences`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}
