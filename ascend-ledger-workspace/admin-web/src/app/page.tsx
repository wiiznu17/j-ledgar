import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      <header className="flex justify-between items-center bg-gray-900 shadow-md p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin. Here is your ledger summary.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Volume', value: '$12,450,123.00', color: 'from-emerald-400 to-teal-500',  },
          { label: 'Active Users', value: '45,231', color: 'from-blue-400 to-indigo-500' },
          { label: 'Pending Transfers', value: '1,204', color: 'from-amber-400 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="group relative bg-gray-900 border border-gray-800 p-6 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
               <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} filter blur-xl`}></div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.label}</h3>
            <p className={`text-4xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 hidden md:block relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-semibold text-white">Recent Activity Network</h2>
          <Link href="/transactions" className="text-sm px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg font-medium transition-colors">
            View All Transactions &rarr;
          </Link>
        </div>
        <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-xl bg-gray-950 relative z-10 overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 group-hover:opacity-10 transition-opacity duration-1000"></div>
          <div className="text-center group-hover:scale-105 transition-transform duration-500">
             <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                 <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             </div>
             <p className="text-gray-400 font-medium">Activity Chart Visualization</p>
             <p className="text-sm text-gray-600 mt-1">Connects to real-time analytics stream</p>
          </div>
        </div>
      </div>
    </div>
  );
}
