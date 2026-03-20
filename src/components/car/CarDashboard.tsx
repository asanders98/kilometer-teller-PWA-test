import { Construction } from 'lucide-react'

export function CarDashboard() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Mijn Auto</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
            Dashboard met km-statistieken, zakelijk/privé verdeling en jaarbudget. Binnenkort beschikbaar!
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1.5">
          <Construction className="w-3.5 h-3.5" />
          In ontwikkeling
        </span>
      </div>
    </div>
  )
}
