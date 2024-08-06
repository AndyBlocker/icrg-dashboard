// export const fetchSummary = async () => {
//     const response = await fetch('https://www.andyblocker.top/api/get_summary');
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     var json = response.json();
//     console.log(json);
//     return json;
//   };
  // utils/api.js
export async function fetchSummary() {
    const response = await fetch('https://www.andyblocker.top/api/get_summary');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const json = await response.json();
    console.log(json);
    return json;
  }
  
  
  export const fetchServerDetails = async (serverName) => {
    const response = await fetch(`https://www.andyblocker.top/api/get_historical_data?server_name=${serverName}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };
  