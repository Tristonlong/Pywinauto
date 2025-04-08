const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

// SVGO配置
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeTitle: false,
          removeDesc: false
        }
      }
    },
    'removeDimensions',
    'sortAttrs'
  ]
};

/**
 * 递归处理目录中的所有SVG文件
 */
async function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await processDirectory(fullPath); // 递归处理子目录
      } else if (stat.isFile() && path.extname(item).toLowerCase() === '.svg') {
        await optimizeAndReplaceSVG(fullPath); // 处理SVG文件
      }
    }
  } catch (error) {
    console.error(`处理目录时出错 ${dirPath}:`, error);
  }
}

/**
 * 优化并替换SVG文件
 */
async function optimizeAndReplaceSVG(filePath) {
  try {
    const svgData = fs.readFileSync(filePath, 'utf8');
    const result = optimize(svgData, {
      ...svgoConfig,
      path: filePath
    });
    
    // 直接覆盖原文件
    fs.writeFileSync(filePath, result.data);
    
    // 计算并显示优化结果
    const originalSize = Buffer.byteLength(svgData, 'utf8');
    const optimizedSize = Buffer.byteLength(result.data, 'utf8');
    const savings = originalSize - optimizedSize;
    const percent = (savings / originalSize * 100).toFixed(2);
    
    console.log(`✓ ${filePath}`);
    console.log(`  大小: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)}`);
    console.log(`  节省: ${formatBytes(savings)} (${percent}% 减少)`);
    console.log('----------------------------------------');
  } catch (error) {
    console.error(`处理文件时出错 ${filePath}:`, error);
  }
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 主函数
 */
async function main() {
  console.log('SVG文件批量优化工具');
  console.log('----------------------------------------');
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('错误: 请指定要处理的目录路径');
    console.log('使用方法: node script.js <目录路径>');
    process.exit(1);
  }

  const targetPath = args[0];
  
  try {
    // 检查路径是否存在
    if (!fs.existsSync(targetPath)) {
      console.error('错误: 指定的路径不存在');
      process.exit(1);
    }

    // 检查是否是目录
    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      console.error('错误: 指定的路径不是目录');
      process.exit(1);
    }

    console.log(`开始处理目录: ${targetPath}`);
    console.log('----------------------------------------');
    
    await processDirectory(targetPath);
    
    console.log('----------------------------------------');
    console.log('所有SVG文件处理完成!');
  } catch (error) {
    console.error('处理过程中出错:', error);
    process.exit(1);
  }
}

// 启动程序
main();