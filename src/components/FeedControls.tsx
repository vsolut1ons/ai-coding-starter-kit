'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FeedControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sort = searchParams.get('sort') ?? 'top'
  const status = searchParams.get('status') ?? 'all'

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <Tabs value={sort} onValueChange={(v) => updateParam('sort', v)}>
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">Neu</TabsTrigger>
        </TabsList>
      </Tabs>
      <Select value={status} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          <SelectItem value="Planned">Planned</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
