import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/app/';

// Configure axios defaults
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Get SVG charts for event feedback analytics
 * 
 * @param {number} eventId - ID of the event
 * @param {string} chartType - Type of chart to fetch (optional: 'all', 'ratings', 'volunteer_again', 'efficiency', 'task_distribution', 'task_status', 'radar')
 * @returns {Promise<Object>} Response with chart SVGs and event data
 */
export const getEventFeedbackCharts = async (eventId, chartType = 'all') => {
  try {
    const response = await axios.get(`${API_URL}events/charts/`, {
      params: {
        event_id: eventId,
        chart_type: chartType
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching event charts:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch event charts'
    };
  }
};

/**
 * Get a single SVG chart for direct display
 * 
 * @param {number} eventId - ID of the event
 * @param {string} chartType - Type of chart to fetch ('average_ratings', 'volunteer_willingness', 'task_status')
 * @returns {Promise<Object>} Response with SVG data
 */
export const getSingleEventChart = async (eventId, chartType) => {
  try {
    // The SVG response is returned directly as raw SVG, not JSON
    const response = await axios.get(`${API_URL}events/chart/`, {
      params: {
        event_id: eventId,
        chart_type: chartType
      },
      responseType: 'text' // Important: we want the raw SVG
    });
    
    return {
      success: true,
      svgContent: response.data
    };
  } catch (error) {
    console.error('Error fetching single chart:', error);
    return {
      success: false,
      error: error.response?.data || error.message || 'Failed to fetch chart'
    };
  }
};

/**
 * Convert SVG content to a data URL for use in <img> tags
 * 
 * @param {string} svgContent - Raw SVG content
 * @returns {string} Data URL representation of the SVG
 */
export const svgToDataUrl = (svgContent) => {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
};

/**
 * Download an SVG chart as a file
 * 
 * @param {string} svgContent - Raw SVG content
 * @param {string} fileName - Name for the downloaded file
 */
export const downloadSvgChart = (svgContent, fileName) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'chart.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Get all chart types and return their display names
 * 
 * @returns {Array<Object>} Array of chart types with IDs and display names
 */
export const getChartTypes = () => {
  return [
    { id: 'all', name: 'All Charts' },
    { id: 'ratings', name: 'Average Ratings' },
    { id: 'volunteer_again', name: 'Volunteer Willingness' },
    { id: 'efficiency', name: 'Volunteer Efficiency' },
    { id: 'task_distribution', name: 'Task Distribution' },
    { id: 'task_status', name: 'Task Status' },
    { id: 'radar', name: 'Feedback Radar' }
  ];
};

/**
 * Get chart types supported by the SingleChartView
 * 
 * @returns {Array<Object>} Array of chart types for SingleChartView
 */
export const getSingleChartTypes = () => {
  return [
    { id: 'average_ratings', name: 'Average Ratings' },
    { id: 'volunteer_willingness', name: 'Volunteer Willingness' },
    { id: 'task_status', name: 'Task Status' }
  ];
};

/**
 * Convert SVG chart to PNG and download it
 * 
 * @param {string} svgContent - Raw SVG content
 * @param {string} fileName - Name for the downloaded file
 * @param {number} width - Width of the output PNG (default: 800)
 * @param {number} height - Height of the output PNG (default: 600)
 */
export const convertSvgToPngAndDownload = (svgContent, fileName, width = 800, height = 600) => {
  // Create a data URL from the SVG
  const svgDataUrl = svgToDataUrl(svgContent);
  
  // Create an Image object to draw to canvas
  const img = new Image();
  img.onload = () => {
    // Create a canvas with the desired dimensions
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Draw the image to the canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert canvas to PNG data URL and download
    const pngDataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = fileName || 'chart.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Set source to trigger the onload event
  img.src = svgDataUrl;
};

/**
 * Download all charts for an event as PNG files in a ZIP archive
 * 
 * @param {number} eventId - ID of the event
 * @param {string} eventName - Name of the event for the filename
 */
export const downloadAllChartsAsPng = async (eventId, eventName) => {
  try {
    // Fetch all charts
    const result = await getEventFeedbackCharts(eventId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const { charts } = result.data;
    
    // If using a ZIP library like JSZip
    // Note: You'd need to add JSZip to your dependencies with: npm install jszip
    // This is just an example of how it would work
    
    /* 
    // This requires the JSZip library - add it if you want this functionality
    import JSZip from 'jszip';
    
    const zip = new JSZip();
    
    // Add each chart to the ZIP
    Object.entries(charts).forEach(([chartName, svgContent]) => {
      // Convert SVG to data URL
      const dataUrl = svgToDataUrl(svgContent);
      
      // Fetch the image data
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          // Add to zip
          zip.file(`${chartName}.png`, blob);
          
          // If all added, generate and download the ZIP
          if (Object.keys(zip.files).length === Object.keys(charts).length) {
            zip.generateAsync({ type: 'blob' }).then(content => {
              const url = URL.createObjectURL(content);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${eventName || `event_${eventId}`}_charts.zip`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
          }
        });
    });
    */
    
    // If not using ZIP, download each chart individually
    Object.entries(charts).forEach(([chartName, svgContent]) => {
      // Use setTimeout to prevent browser throttling multiple downloads
      setTimeout(() => {
        convertSvgToPngAndDownload(
          svgContent, 
          `${eventName || `event_${eventId}`}_${chartName}.png`
        );
      }, 300); // Add small delay between downloads
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading charts as PNG:', error);
    return {
      success: false,
      error: error.message || 'Failed to download charts'
    };
  }
};

export default {
  getEventFeedbackCharts,
  getSingleEventChart,
  svgToDataUrl,
  downloadSvgChart,
  getChartTypes,
  getSingleChartTypes,
  convertSvgToPngAndDownload,
  downloadAllChartsAsPng
};