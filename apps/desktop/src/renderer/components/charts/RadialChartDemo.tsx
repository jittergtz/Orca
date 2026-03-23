import { RadialBar, RadialBarChart, PolarGrid } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]

const chartConfig = {
  safari: {
    label: "Safari",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export function RadialChartDemo() {
  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px] w-full p-4 text-white">
      <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
        <PolarGrid gridType="circle" radialLines={false} stroke="none" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <RadialBar dataKey="visitors" cornerRadius={10} />
      </RadialBarChart>
    </ChartContainer>
  )
}
