export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">CréancePro</h1>
          <p className="text-slate-500 mt-1">Gestion de créances pour PME belges</p>
        </div>
        {children}
      </div>
    </div>
  )
}
