import { Card, CardContent, Typography } from '@mui/material'

function StatCard({ title, value, helper }) {
  return (
    <Card className="h-full rounded-2xl shadow-sm">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" className="mt-2 font-semibold text-slate-900">
          {value ?? '--'}
        </Typography>
        {helper ? (
          <Typography variant="caption" color="text.secondary" className="mt-2 block">
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default StatCard
