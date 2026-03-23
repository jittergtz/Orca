import React from 'react'

function SearchResultContainer() {
  return (
    <main className='h-[90vh] w-full    p-5 flex justify-center gap-3 items-center '>
             
             {/* History Upcoming Summary Events */}
             <div className='flex flex-col gap-3 h-full w-full max-w-[600px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-2'>History Upcoming Events</h1>
            <div className='max-w-[600px] w-full   shadow-sm  border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>

            </div>
            </div>


              {/* Recent Realtime News */}
          <div className='flex flex-col gap-2 h-full w-full max-w-[500px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-3'>Realtime News</h1>
            <div className='max-w-[500px] w-full shadow-sm  border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>

            </div>
            </div>


              {/*Stock financial situation */}
           <div className='flex flex-col gap-2 h-full w-full max-w-[700px]'>
             <h1 className='italic font-instrument-serif text-2xl ml-2'>Stock Finance</h1>
            <div className='max-w-[700px] w-full shadow-sm  border-white/30 rounded-3xl bg-white/20 dark:bg-[#6e6e6e17] h-full '>

            </div>
            </div>
        
    </main>
  )
}

export default SearchResultContainer