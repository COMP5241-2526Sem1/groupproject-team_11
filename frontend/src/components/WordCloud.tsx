import { useEffect, useRef } from "react";
import WordCloud from "wordcloud";

interface WordCloudComponentProps {
  words: string[];
  width?: number;
  height?: number;
}

export const WordCloudComponent = ({ 
  words, 
  width = 600, 
  height = 400 
}: WordCloudComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return;

    // 统计词频
    const wordFrequency: { [key: string]: number } = {};
    
    words.forEach((text) => {
      // 分词：按空格、标点符号分割
      const cleanText = text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, ' '); // 保留英文、数字和中文
      
      const tokens = cleanText.split(/\s+/).filter(word => word.length > 1);
      
      tokens.forEach((word) => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    });

    // 转换为词云格式 [word, weight]
    const wordList: [string, number][] = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1]) // 按频率排序
      .slice(0, 100) // 最多显示100个词
      .map(([word, freq]) => [word, freq * 10]); // 放大权重以便显示

    if (wordList.length === 0) {
      // 如果没有有效词汇，显示原始文本的前几个词
      const fallbackWords = words.slice(0, 10).map((word, index) => 
        [word.substring(0, 20), 10 - index] as [string, number]
      );
      
      WordCloud(canvasRef.current, {
        list: fallbackWords,
        gridSize: Math.round(16 * width / 1024),
        weightFactor: (size) => Math.pow(size, 1.5) * width / 600,
        fontFamily: 'Times, serif, "Microsoft YaHei", sans-serif',
        color: () => {
          const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3,
        backgroundColor: '#f9fafb',
      });
    } else {
      WordCloud(canvasRef.current, {
        list: wordList,
        gridSize: Math.round(16 * width / 1024),
        weightFactor: (size) => Math.pow(size, 1.3) * width / 600,
        fontFamily: 'Times, serif, "Microsoft YaHei", sans-serif',
        color: () => {
          const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3,
        rotationSteps: 2,
        backgroundColor: '#f9fafb',
        minSize: 12,
      });
    }
  }, [words, width, height]);

  if (words.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <p className="text-muted-foreground">No responses yet</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="max-w-full"
      />
    </div>
  );
};
