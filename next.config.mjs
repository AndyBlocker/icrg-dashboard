import withTM from 'next-transpile-modules';

const withTMPlugin = withTM([
  'rc-util',
  'rc-pagination',
  'rc-picker',
  '@ant-design/icons',
  '@babel/runtime',
]);

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 添加静态导出的配置
  basePath: '/icrg-dashboard', // 添加 basePath 配置
};

export default withTMPlugin(nextConfig);