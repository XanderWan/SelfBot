// Shared styles & settings
const chartStyles = {
    containerBackground: "linear-gradient(135deg, #ffffff, #f8fafc)",
    // Updated to use Roboto as primary font for a cleaner look
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    titleSize: "18px",
    axisColor: "#94a3b8",
    gridColor: "#e2e8f0",
    tooltipStyles: `
      background-color: rgba(255, 255, 255, 0.98);
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: 'Roboto', system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      transition: opacity 0.2s ease-in-out;
    `,
  };
  
  // Utility: Create a consistent container for any chart
  function createContainer(selector) {
    d3.select(selector).selectAll("*").remove();
    return d3.select(selector)
      .append("div")
      .style("background", chartStyles.containerBackground)
      .style("border-radius", "12px")
      .style("padding", "16px")
      .style("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.1)");
  }
  
  // ---------------------------------------------------------------------------
  // Render the Top 10 User Activity Bar Chart
  // ---------------------------------------------------------------------------
  export async function renderUserActivity(tooltip) {
    try {
      let data = await d3.json("/api/stats/user-activity");
      data = data.sort((a, b) => b.messageCount - a.messageCount).slice(0, 10);
  
      const margin = { top: 40, right: 30, bottom: 60, left: 60 };
      const width = 560 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
  
      const container = createContainer("#userActivityChart");
      const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Vertical gradient for bars
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "barGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#4f46e5")
        .attr("stop-opacity", 0.95);
      gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#6366f1")
        .attr("stop-opacity", 0.9);
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#818cf8")
        .attr("stop-opacity", 0.85);
  
      // Scales with vertical padding: the y range now maps to [height, 10] so that 10px of space appears at the top.
      const x = d3.scaleBand()
        .domain(data.map(d => d.username))
        .range([0, width])
        .padding(0.3);
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.messageCount)]).nice()
        .range([height, 10]);
  
      // Add grid lines (dashed)
      svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
        )
        .style("stroke", chartStyles.gridColor)
        .style("stroke-dasharray", "3 3")
        .style("stroke-opacity", 0.7);
  
      // X axis with rotated labels
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-family", chartStyles.fontFamily)
        .style("font-size", "12px")
        .style("fill", chartStyles.axisColor);
  
      // Y axis
      svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickFormat(d => d.toLocaleString())
        )
        .style("font-family", chartStyles.fontFamily)
        .style("font-size", "12px")
        .style("fill", chartStyles.axisColor);
  
      // Bars with transition
      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.username))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", "url(#barGradient)")
        .attr("rx", 4)
        .style("cursor", "pointer")
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr("y", d => y(d.messageCount))
        .attr("height", d => height - y(d.messageCount));
  
      // Interaction overlay for tooltips
      svg.selectAll(".bar-interaction")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-interaction")
        .attr("x", d => x(d.username))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.messageCount))
        .attr("height", d => height - y(d.messageCount))
        .attr("fill", "transparent")
        .on("mouseover", function(event, d) {
          d3.select(this.parentNode).selectAll(".bar")
            .transition().duration(200)
            .style("opacity", 0.8);
          tooltip.transition().duration(200)
            .style("opacity", 1);
          tooltip.html(`
            <div style="${chartStyles.tooltipStyles}">
              <strong>${d.username}</strong><br>
              ${d.messageCount.toLocaleString()} messages
            </div>
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          d3.select(this.parentNode).selectAll(".bar")
            .transition().duration(200)
            .style("opacity", 1);
          tooltip.transition().duration(200)
            .style("opacity", 0);
        });
  
      // Chart title
      svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-family", chartStyles.fontFamily)
        .style("font-size", chartStyles.titleSize)
        .style("font-weight", "600")
        .style("fill", "#1e293b")
        .text("Top 10 Most Active Users");
  
    } catch (error) {
      console.error("Error rendering user activity chart:", error);
      d3.select("#userActivityChart")
        .append("div")
        .attr("class", "error-message")
        .style("color", "#ef4444")
        .style("text-align", "center")
        .style("padding", "2rem")
        .text("Error loading user activity data");
    }
  }
  
  // ---------------------------------------------------------------------------
  // Render the Mentions Pie Chart (Aesthetics standardized)
  // ---------------------------------------------------------------------------
  export async function renderMentions(tooltip) {
    try {
      const apiResponse = await fetch("/api/stats/mentions").then(res => res.json());
      const data = apiResponse.mentionsData;
      if (!Array.isArray(data)) {
        console.error("Expected array of mentions data, got:", typeof data);
        return;
      }
  
      const width = 560, height = 400;
      const radius = Math.min(width, height) / 2.5;
  
      const container = createContainer("#mentionsChart");
      const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);
  
      // Define color palettes and gradients
      const colors = {
        user: d3.schemeSet3.slice(0, 6),
        role: d3.schemeSet3.slice(6)
      };
  
      const defs = svg.append("defs");
      data.forEach((d, i) => {
        const gradient = defs.append("linearGradient")
          .attr("id", `pieGradient${i}`)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%");
        const baseColor = d.type === "user" ? colors.user[i % colors.user.length] : colors.role[i % colors.role.length];
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", baseColor)
          .attr("stop-opacity", 1);
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(baseColor).darker(0.6))
          .attr("stop-opacity", 0.8);
      });
  
      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
      const arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(radius);
  
      const arcs = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");
  
      // Draw pie slices with interactive tooltips
      arcs.append("path")
        .attr("class", "pie-slice")
        .attr("d", arc)
        .attr("fill", (d, i) => `url(#pieGradient${i})`)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          tooltip.transition().duration(200)
            .style("opacity", 1);
          tooltip.html(`
            <div style="${chartStyles.tooltipStyles}">
              <strong>${d.data.type === "user" ? "User" : "Role"} ID: ${d.data.id}</strong><br>
              ${d.data.count} mentions (${d.data.percentage}%)<br>
              ${d.data.messages.length} unique messages
            </div>
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500)
            .style("opacity", 0);
        });
  
      // Add labels for larger slices
      arcs.filter(d => (d.endAngle - d.startAngle) > 0.25)
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "#ffffff")
        .style("font-size", "12px")
        .text(d => d.data.count);
  
      // Chart title
      svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -height / 2 + 20)
        .style("font-size", "16px")
        .style("font-family", chartStyles.fontFamily)
        .style("fill", "#1e293b")
        .text(`Mentions Analysis (Total: ${apiResponse.totalMentions})`);
  
    } catch (error) {
      console.error("Error rendering mentions chart:", error);
      d3.select("#mentionsChart")
        .append("div")
        .attr("class", "error-message")
        .style("color", "#ef4444")
        .style("text-align", "center")
        .style("padding", "1rem")
        .text("Error loading mentions data. Please try again later.");
    }
  }
  
  // ---------------------------------------------------------------------------
  // Render the Time Activity Line Chart (Aesthetics standardized)
  // ---------------------------------------------------------------------------
export async function renderTimeActivity(tooltip) {
    try {
        const data = await d3.json("/api/stats/time-activity");
        const margin = { top: 30, right: 30, bottom: 40, left: 50 };
        const width = 560 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const container = createContainer("#timeActivityChart");
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Horizontal gradient for the line
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
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

        // Parse date and set up scales (with top padding: y range from height to 10)
        const parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(d => { d.date = parseDate(d.date); });
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)]).nice()
            .range([height, 10]);

        // Add grid lines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                        .tickSize(-width)
                        .tickFormat("")
            )
            .style("stroke", chartStyles.gridColor)
            .style("stroke-dasharray", "3 3")
            .style("stroke-opacity", 0.7);

        // X axis styling
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5))
            .selectAll("text")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", "12px")
            .style("fill", chartStyles.axisColor);

        // Y axis styling (removing the domain line)
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", "12px")
            .style("fill", chartStyles.axisColor);

        // Draw the line with a smooth curve
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.count))
            .curve(d3.curveMonotoneX);
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "url(#lineGradient)")
            .attr("stroke-width", 2);

        // Data point dots with interactive tooltips
        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.count))
            .attr("r", 4)
            .attr("fill", "#0ea5e9")
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200)
                    .style("opacity", 1);
                tooltip.html(`
                    <div style="${chartStyles.tooltipStyles}">
                        <strong>${d3.timeFormat("%Y-%m-%d")(d.date)}</strong><br>
                        ${d.count} messages
                    </div>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500)
                    .style("opacity", 0);
            });

        // Chart title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", chartStyles.titleSize)
            .style("font-weight", "600")
            .style("fill", "#1e293b")
            .text("User Activity Over Time");

    } catch (error) {
        console.error("Error rendering time activity chart:", error);
        d3.select("#timeActivityChart")
            .append("div")
            .attr("class", "error-message")
            .style("color", "#ef4444")
            .style("text-align", "center")
            .style("padding", "2rem")
            .text("Error loading time activity data");
    }
}
  // ---------------------------------------------------------------------------
  // Render the Content Analysis Horizontal Bar Chart (Aesthetics standardized)
  // ---------------------------------------------------------------------------
export async function renderContentAnalysis(tooltip) {
    try {
        let data = await d3.json("/api/stats/content-analysis");
        data = data.slice(0, 10); // Top 10 words

        const margin = { top: 30, right: 30, bottom: 40, left: 120 };
        const width = 560 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const container = createContainer("#contentAnalysisChart");
        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Horizontal gradient for bars
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

        // Adjust x scale to include a 5% padding
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) * 1.05])
            .range([0, width]);
        const y = d3.scaleBand()
            .domain(data.map(d => d.word))
            .range([0, height])
            .padding(0.2);

        // Add vertical grid lines for x axis
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                        .tickSize(-height)
                        .tickFormat("")
            )
            .style("stroke", chartStyles.gridColor)
            .style("stroke-dasharray", "3 3")
            .style("stroke-opacity", 0.7);

        // X axis styling (using improved 14px fonts)
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", "14px")
            .style("fill", chartStyles.axisColor);

        // Y axis styling (using 14px fonts)
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", "14px")
            .style("fill", chartStyles.axisColor);

        // Draw horizontal bars with interactive tooltips
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.word))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.count))
            .attr("fill", "url(#horizontalBarGradient)")
            .attr("rx", 4)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200)
                    .style("opacity", 1);
                tooltip.html(`
                    <div style="${chartStyles.tooltipStyles}">
                        <strong>${d.word}</strong><br>
                        ${d.count} occurrences
                    </div>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500)
                    .style("opacity", 0);
            });

        // Chart title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-family", chartStyles.fontFamily)
            .style("font-size", chartStyles.titleSize)
            .style("font-weight", "600")
            .style("fill", "#1e293b")
            .text("Content Analysis");

    } catch (error) {
        console.error("Error rendering content analysis chart:", error);
        d3.select("#contentAnalysisChart")
            .append("div")
            .attr("class", "error-message")
            .style("color", "#ef4444")
            .style("text-align", "center")
            .style("padding", "2rem")
            .text("Error loading content analysis data");
    }
}
  