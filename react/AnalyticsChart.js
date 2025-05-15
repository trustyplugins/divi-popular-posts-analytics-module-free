import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Cookies from "js-cookie";
import DatePicker from "react-datepicker";
//import "react-datepicker/dist/react-datepicker.css";

const AnalyticsChart = () => {
  const chartRef = useRef();
  const chartAreaRef = useRef();
  const isInitialLoadRef = useRef(true);
  const [topData, setTopData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [avPostTypes, setAvPostTypes] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState("");
  const [totalPostsviews, setTotalPostsviews] = useState(0);
  const [filteredPostsviews, setFilteredPostsviews] = useState(0);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [filteredPostsCount, setFilteredPostsCount] = useState(0);
  const [lastMonthViews, setLastMonthViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [trendingData, setTrendingData] = useState([]);
  // Date range states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Subtract 30 days
    return date; // Store as a Date object
  });


  const stateRef = useRef({
    startDate,
    endDate,
    selectedPostType,
  });

  useEffect(() => {
    stateRef.current = {
      startDate,
      endDate,
      selectedPostType,
    };
  }, [startDate, endDate, selectedPostType]);


  const [endDate, setEndDate] = useState(() => new Date()); // Today's date as a Date object


  const [activeTab, setActiveTab] = useState("startDate"); // Tracks active tab
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); // Tracks visibility of date picker tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab); // Update active tab
  }
  const toggleDatePickerVisibility = () => {
    setIsDatePickerVisible((prev) => !prev); // Toggle visibility
  };


  const fetchData = (startDate, endDate, selectedPostType) => {
    //console.log(tpdivi_analytics);
    const endpoint = `${tpdivi_analytics.site_url}/wp-json/tp/v1/chart/post-views/`;
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': tpdivi_analytics.nonce, 
      },
      body: JSON.stringify({
        attributes: {
          startDate: startDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split("T")[0],
          postType: selectedPostType, // Include selected post type
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
         //console.log(data);
        let formattedData = '';
        if (data.postdata) {
          const dt = data.postdata;
          formattedData = dt.map((item) => ({
            postName: item.postName,
            id: item.id,
            views: item.views,
          }));
          const sortedByViewsDescending = data.postdata.sort((a, b) => b.views - a.views);
          setAllData(sortedByViewsDescending);
        }
        let areachartdata = '';
        if (data.views_by_date) {
          areachartdata = data.views_by_date;
        }
        //console.log(areachartdata);
       
        setTopData(data.top_posts_data || []);
        setTrendingData(data.trendingdata || []);
        setAvPostTypes(data.available_post_types || []);
        setTotalPostsviews(data.total_views || 0);
        setTotalPostsCount(data.total_posts || 0);
        setFilteredPostsviews(data.filtered_views || 0);
        setFilteredPostsCount(data.filtered_posts || 0);
        setLastMonthViews(data.last_month_views || 0);
        setTodayViews(data.today_views || 0);
        renderChart(formattedData);
        //console.log("area",areachartdata,startDate,endDate);
        renderAreaChart(areachartdata, startDate, endDate);

        setDataLoading(false);
        isInitialLoadRef.current = false;
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  };
  const formatViews = (views) => {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1).replace(/\.0$/, '') + "M";
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1).replace(/\.0$/, '') + "K";
    }
    return views.toString();
};
  const toggleRealtimeUpdates = () => {
    setIsRealtime((prevState) => {
      const newState = !prevState;
      Cookies.set("isRealtime", newState, { expires: 7 }); // Store the state in cookies for 7 days
      if (newState) {
        // Start real-time updates
        const id = setInterval(() => {
          // Pass latest state values directly to fetchData
          fetchData(startDate, endDate, selectedPostType);
        }, 10000); // 10 seconds interval
        setIntervalId(id);
      } else {
        // Stop real-time updates
        clearInterval(intervalId);
        setIntervalId(null);
      }
      return newState;
    });
  };

  useEffect(() => {
    const savedState = Cookies.get("isRealtime") === "true";
    setIsRealtime(savedState);

    if (savedState) {
      const id = setInterval(() => {
        // Pass latest state values directly to fetchData
        fetchData(startDate, endDate, selectedPostType);
      }, 10000); // 10 seconds interval
      setIntervalId(id);
    }

    // Fetch data initially with the latest state values
    fetchData(startDate, endDate, selectedPostType);

    return () => clearInterval(intervalId);
  }, [selectedPostType]); // Re-run on state changes

  // Event handler for Apply button click
  const handleApplyClick = () => {
    setDataLoading(true);
    fetchData(startDate, endDate, selectedPostType); // Fetch data with the selected date range
    setIsDatePickerVisible(false); // Hide the date picker
  };
  // Event handler for post type change
  const handlePostTypeChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedPostType(selectedValue);
    setDataLoading(true);
    //  fetchData(); // Fetch data with the new post type
  };

  const renderChart = (data) => {
    if (!data) {
      data = [];
    }
    // Chart dimensions
    var chartWidth = 1500;
    if (jQuery("#wpbody-content .wrap").length) {
      chartWidth = (jQuery("#wpbody-content .wrap").width() / 2 - 40);
    }
    const width = chartWidth;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };

    // Clear any existing chart
    d3.select(chartRef.current).select("svg").remove();

    // Create the SVG canvas
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Set up scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.postName)) // Use post names for the x-axis
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.views)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)") // Rotate labels for readability
      .style("text-anchor", "end");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Add bars
    const bars = svg
      .selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.postName))
      .attr("y", () => height - margin.bottom) // Start from the bottom
      .attr("width", xScale.bandwidth())
      .attr("height", 0) // Start with no height
      .attr("fill", "steelblue")
      .attr("rx", 2.5); // Adds rounded corner
    // Apply animation only on the first load
    if (isInitialLoadRef.current) {
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // Use 10 different colors
      bars
        .transition() // Add a transition for the first load
        .duration(800)
        .attr("y", (d) => yScale(d.views)) // Move to the final y position
        .attr("height", (d) => height - margin.bottom - yScale(d.views)) // Grow the height upwards
        .attr("fill", (d, i) => colorScale(i));
    } else {
      // For subsequent updates, just set the new heights without animation
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // Use 10 different colors

bars
  .attr("y", (d) => yScale(d.views))
  .attr("height", (d) => height - margin.bottom - yScale(d.views))
  .attr("fill", (d, i) => colorScale(i)); // Assign colors based on index

    }

    // Add tooltips
    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("visibility", "hidden");

    svg
      .selectAll(".bar")
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<strong>${d.postName}</strong><br>ID: ${d.id}<br>Views: ${d.views}`
          )
          .style("visibility", "visible")
          .style("left", `${event.pageX - 250}px`)
          .style("top", `${event.pageY - 0}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX - 250}px`)
          .style("top", `${event.pageY - 0}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

  };
  const renderAreaChart = (data, startDate, endDate) => {
    if (!data) {
      data = [];
    }

    // Chart dimensions
    var chartWidth = 1500;
    if (jQuery("#wpbody-content .wrap").length) {
      chartWidth = jQuery("#wpbody-content .wrap").width() / 2 - 40;
    }
    const width = chartWidth;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };

    // Clear any existing chart
    d3.select(chartAreaRef.current).select("svg").remove();

    // Create the SVG canvas
    const svg = d3
      .select(chartAreaRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Convert data's date strings into actual Date objects
    const processedData = data.map((d) => ({
      date: new Date(d.view_date), // Convert ISO string to Date object
      views: parseInt(d.total_views, 10), // Convert views to a number
    }));


    // Set up scales
    const xScale = d3
      .scaleTime()
      .domain([startDate, endDate]) // Use the Date objects for the x-axis domain
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processedData, (d) => d.views)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Define the area generator
    const area = d3
      .area()
      .x((d) => xScale(d.date)) // Map dates to x-axis
      .y0(height - margin.bottom)
      .y1((d) => yScale(d.views)) // Map views to y-axis
      .curve(d3.curveMonotoneX); // Smooth the curve

    // Add the area path
    svg
      .append("path")
      .datum(processedData)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .attr("d", area);

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d"))) // Format dates
      .selectAll("text")
      .attr("transform", "rotate(-45)") // Rotate labels for readability
      .style("text-anchor", "end");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Add tooltips
    const tooltip = d3
      .select(chartAreaRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("visibility", "hidden");

    // Add the area path
    // Add the area path with stroke for the top line
    svg
      .append("path")
      .datum(processedData)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .attr("d", area)
      .attr("stroke", "black") // Set stroke color
      .attr("stroke-width", 2) // Set stroke width
      .on("mouseover", (event) => {
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", (event) => {
        // Get the closest data point based on mouse position
        const [mouseX] = d3.pointer(event);
        const closestDate = xScale.invert(mouseX); // Convert mouse X position to date
        const closestData = processedData.reduce((prev, curr) =>
          Math.abs(curr.date - closestDate) < Math.abs(prev.date - closestDate)
            ? curr
            : prev
        );

        tooltip
          .html(
            `<strong>${d3.timeFormat("%Y-%m-%d")(closestData.date)}</strong><br>Views: ${closestData.views}`
          )
          .style("left", `${event.pageX - 250}px`)
          .style("top", `${event.pageY}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

  };


  return (
    <>
      <div className="tp-admin-dashboard-container loading-wrapper">

        {dataLoading ? (
          <div className="loading-indicator"></div> // Display loading text or spinner
        ) : (
          <>
            <div className="tp-top-action-bar">
              <h2><span className="dashicons dashicons-analytics"></span> Analytics Dashboard <span className='tp-promo'>by Trusty Plugins</span></h2>
              <div className="tp-right-actions">
                
                
              </div>
            </div>
            <div className="tp-top-widgets-container loaded-content tp-space-control">
              <div className="tp-top-posts-widget tp-posts-center-widget">
                <div className="tp-posts-views-widget tp-widget-common">
                  <div className="tp-post-widget-data">
                    {topData && topData.length > 0 ? (
                      <>
                        <div className="tp-view-manager">
                          <div className="views-cnt" title={filteredPostsviews}><h2>{formatViews(filteredPostsviews || 0) }</h2><h5>Post Views</h5></div>
                          {/* <span className="dashicons dashicons-welcome-view-site"></span> */}
                          <span className="trusty-analytics-icons tp-icon-views"><img src={`${tpdivi_analytics.assets_url}/icon-views.png`} /></span>
                        </div>
                        <div className="tp-filter-view-data" title={totalPostsviews}><h2>Total Views : {formatViews(totalPostsviews)} <span className="dashicons dashicons-arrow-up"></span></h2></div>
                      </>
                    )
                      : (
                        <div className="error-message">No data available</div> // Error message when topData is empty or null
                      )}

                  </div>
                </div>
                <div className="tp-posts-counts-widget tp-widget-common">
                  <div className="tp-post-widget-data">
                    {topData && topData.length > 0 ? (
                      <>
                        <div className="tp-view-manager">
                          <div className="views-cnt" title={filteredPostsCount}><h2>{formatViews(filteredPostsCount)}</h2><h5>Posts</h5></div>
                          <span className="trusty-analytics-icons tp-icon-views"><img src={`${tpdivi_analytics.assets_url}/icon-posts.png`} /></span>
                        </div>
                        <div className="tp-filter-view-data" title={totalPostsCount}><h2>Total Posts : {formatViews(totalPostsCount)} <span className="dashicons dashicons-arrow-up"></span></h2></div></>
                    )
                      : (
                        <div className="error-message">No data available</div> // Error message when topData is empty or null
                      )}

                  </div>
                </div>

                <div className="tp-posts-counts-widget tp-widget-common">
                  <div className="tp-post-widget-data">
                    {topData && topData.length > 0 ? (
                      <>
                        <div className="tp-view-manager">
                        <div className="views-cnt" title={lastMonthViews}><h2>{formatViews(lastMonthViews)}</h2><h5>Last Month</h5></div>
                        <span className="trusty-analytics-icons tp-icon-views"><img src={`${tpdivi_analytics.assets_url}/icon-month.png`} /></span>
                        </div>
                        <div className="tp-filter-view-data" title={totalPostsviews}><h2>Total Views : {formatViews(totalPostsviews)} <span className="dashicons dashicons-arrow-up"></span></h2></div></>
                    )
                      : (
                        <div className="error-message">No data available</div> // Error message when topData is empty or null
                      )}

                  </div>
                </div>

                <div className="tp-posts-counts-widget tp-widget-common">
                  <div className="tp-post-widget-data">
                    {topData && topData.length > 0 ? (
                      <>
                        <div className="tp-view-manager">
                        <div className="views-cnt" title={todayViews}><h2>{formatViews(todayViews)}</h2><h5>Today's Views</h5></div>
                        <span className="trusty-analytics-icons tp-icon-views"><img src={`${tpdivi_analytics.assets_url}/icon-day.png`} /></span>
                        </div>
                        <div className="tp-filter-view-data" title={totalPostsviews}><h2>Total Views : {formatViews(totalPostsviews)} <span className="dashicons dashicons-arrow-up"></span></h2></div></>
                    )
                      : (
                        <div className="error-message">No data available</div> // Error message when topData is empty or null
                      )}

                  </div>
                </div>


              </div>
            </div></>
        )}



        <div className="tp-chart-container tp-space-control">
          <div className="tp-chart-one" ref={chartRef}></div>
          <div className="tp-chart-two" ref={chartAreaRef}></div>
        </div>
        <div className="tp-footer-posts-container tp-space-control">
          <h2 className="top-content">Your top content in this period</h2>
          <div className="top-header-tr">
            <h4>Content</h4>
            <h4>Views</h4>
          </div>

          {allData.slice(0, 10).map((item, key) => (
            <div className={`tp-footer-post-widget footer-post-${key}`} key={item.id} >
              <div className="tp-footer-title-wrapper">
                <div className="tp-footer-post-thumb">
                  <img src={item.thumbnail} alt={`${item.postName} Thumbnail`} />
                </div>
                <div className="tp-footer-post-title">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">{item.postName}</a>
                  <span><div>{item.ptype}</div>{item.pdate}</span>
                </div>
                <div className="tp-footer-post-views">{item.views} <span className="dashicons dashicons-visibility"></span></div>
              </div>
            </div>
          ))}



        </div>



      </div>
    </>
  )
};

export default AnalyticsChart;
