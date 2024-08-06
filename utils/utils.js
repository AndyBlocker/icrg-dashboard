export const calculateAverageGpuUsage = (gpuInfo) => {
    if (!gpuInfo.length) return 0;
    const total = gpuInfo.reduce((sum, gpu) => sum + gpu.utilization, 0);
    const averageUsage = (total / gpuInfo.length).toFixed(2);
    return averageUsage;
  };
  
  export const calculateTotalMemoryUsage = (gpuInfo) => {
    if (!gpuInfo.length) return 0;
    const totalUsed = gpuInfo.reduce((sum, gpu) => sum + gpu.memory_used, 0);
    const totalMemory = gpuInfo.reduce((sum, gpu) => sum + gpu.memory_total, 0);
    const totalMemoryUsage = ((totalUsed / totalMemory) * 100).toFixed(2);
    return totalMemoryUsage;
  };
  
  export const calculateCpuUsage = (cpuUsage) => {
    return cpuUsage.toFixed(2);
  };
  