import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MovieRatingData } from '../../types';

interface RatingChartProps {
  data: MovieRatingData;
}

export const RatingChart: React.FC<RatingChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Kinopoisk',
      rating: data.kpRating,
      color: '#f97316', // Orange-500
      votes: data.kpVotes,
    },
    {
      name: 'IMDb',
      rating: data.imdbRating,
      color: '#eab308', // Yellow-500
      votes: 'N/A', // Usually we don't fetch imdb votes separately in the schema but we could
    },
  ];

  return (
    <div className="w-full h-48 sm:h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          layout="vertical"
        >
          <XAxis type="number" domain={[0, 10]} hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#ffffff', opacity: 0.1 }}
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '8px',
              color: '#fff',
            }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value} / 10`, 'Рейтинг']}
          />
          <Bar dataKey="rating" radius={[0, 4, 4, 0]} barSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
