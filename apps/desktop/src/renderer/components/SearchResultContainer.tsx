
import { LineChartDemo } from './charts/LineChartDemo'
import { RadialChartDemo } from './charts/RadialChartDemo'
import { BarChartDemo } from './charts/BarChartDemo'
function SearchResultContainer() {
  return (
    <main className='h-[90vh] w-full    p-5 flex justify-center gap-3 items-center '>
             
             {/* History Upcoming Summary Events */}
             <div className='flex flex-col gap-3 h-full w-full max-w-[600px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-2'>History Upcoming Events</h1>
            <div className='max-w-[600px] w-full flex items-center justify-center overflow-hidden shadow-sm border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>
              <LineChartDemo />
            </div>
            </div>


              {/* Recent Realtime News */}
          <div className='flex flex-col gap-2 h-full w-full max-w-[500px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-3'>Realtime News</h1>
            <div className='max-w-[500px] w-full flex items-center justify-center overflow-hidden shadow-sm border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>
              <RadialChartDemo />
            </div>
            </div>


              {/*Stock financial situation */}
           <div className='flex flex-col gap-2 h-full w-full max-w-[700px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-2'>Stock Finance</h1>
            <div className='max-w-[700px] w-full flex items-center justify-center overflow-hidden shadow-sm border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>
              <BarChartDemo />
            </div>
            </div>
        
    </main>
  )
}

export default SearchResultContainer