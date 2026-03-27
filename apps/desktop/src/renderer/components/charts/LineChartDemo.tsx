import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { day: "Mon", visitors: 154 },
  { day: "Tue", visitors: 205 },
  { day: "Wed", visitors: 177 },
  { day: "Thu", visitors: 301 },
  { day: "Fri", visitors: 284 },
  { day: "Sat", visitors: 190 },
  { day: "Sun", visitors: 212 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "#10b981",
  },
} satisfies ChartConfig

export function LineChartDemo() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full p-4 text-white">
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis width={40} tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="visitors" stroke="var(--color-visitors)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  )
}
