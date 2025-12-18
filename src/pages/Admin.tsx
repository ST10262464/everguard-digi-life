import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  Key, 
  FileText, 
  Database, 
  Activity,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

import { API_URL, BLOCKDAG_EXPLORER } from '@/config/api';

interface AdminStats {
  users: { total: number; patients: number; medics: number };
  capsules: { total: number };
  burstKeys: { total: number; active: number; consumed: number; expired: number };
  audit: { total: number };
  medics: { total: number; verified: number; pending: number };
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [capsules, setCapsules] = useState<any[]>([]);
  const [burstKeys, setBurstKeys] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [medics, setMedics] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'capsules' | 'burstkeys' | 'audit' | 'medics' | 'transactions'>('overview');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, capsulesRes, burstKeysRes, auditRes, medicsRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`),
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/admin/capsules`),
        fetch(`${API_URL}/api/admin/burstkeys`),
        fetch(`${API_URL}/api/admin/audit`),
        fetch(`${API_URL}/api/admin/medics`),
        fetch(`${API_URL}/api/admin/transactions`)
      ]);

      const [statsData, usersData, capsulesData, burstKeysData, auditData, medicsData, txData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        capsulesRes.json(),
        burstKeysRes.json(),
        auditRes.json(),
        medicsRes.json(),
        txRes.json()
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setCapsules(capsulesData.capsules || []);
      setBurstKeys(burstKeysData.burstKeys || []);
      setAuditLogs(auditData.logs || []);
      setMedics(medicsData.medics || []);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDate = (dateString: string | number) => {
    if (typeof dateString === 'number') {
      return new Date(dateString).toLocaleString();
    }
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'consumed': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch(eventType) {
      case 'BURST_KEY_ISSUED': return 'text-green-600 bg-green-100';
      case 'BURST_KEY_CONSUMED': return 'text-blue-600 bg-blue-100';
      case 'RESTRICTED_ACCESS_ATTEMPT': return 'text-orange-600 bg-orange-100';
      case 'ACTIVE_KEY_BLOCKED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete system overview and data management</p>
          </div>
          <Button onClick={fetchAllData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview Cards */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('users')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.users.patients} patients, {stats.users.medics} medics
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('capsules')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Capsules</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.capsules.total}</div>
                <p className="text-xs text-muted-foreground">
                  Encrypted medical data
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('burstkeys')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">BurstKeys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.burstKeys.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.burstKeys.active} active, {stats.burstKeys.consumed} consumed, {stats.burstKeys.expired} expired
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('audit')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.audit.total}</div>
                <p className="text-xs text-muted-foreground">
                  All access attempts logged
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('medics')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Medic Registry</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.medics.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.medics.verified} verified, {stats.medics.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('transactions')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Blockchain TXs</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  BlockDAG transactions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Navigation */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              {['overview', 'users', 'capsules', 'burstkeys', 'audit', 'medics', 'transactions'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">All Users ({users.length})</CardDescription>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">User ID</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Role</th>
                        <th className="p-2 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{user.id}</td>
                          <td className="p-2">{user.name}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">
                            <Badge variant={user.role === 'medic' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Capsules Tab */}
            {activeTab === 'capsules' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">All Capsules ({capsules.length})</CardDescription>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Capsule ID</th>
                        <th className="p-2 text-left">Owner ID</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">Blockchain ID</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capsules.map((capsule) => (
                        <tr key={capsule.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{capsule.id}</td>
                          <td className="p-2 font-mono text-xs">{capsule.ownerId}</td>
                          <td className="p-2">
                            <Badge>{capsule.capsuleType}</Badge>
                          </td>
                          <td className="p-2">
                            {capsule.blockchainId ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                #{capsule.blockchainId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Pending...</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">{capsule.status}</Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDate(capsule.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BurstKeys Tab */}
            {activeTab === 'burstkeys' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">All BurstKeys ({burstKeys.length})</CardDescription>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Burst ID</th>
                        <th className="p-2 text-left">Capsule</th>
                        <th className="p-2 text-left">Accessor</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Issued At</th>
                        <th className="p-2 text-left">Expires At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {burstKeys.map((key) => (
                        <tr key={key.burstId} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{key.burstId}</td>
                          <td className="p-2 font-mono text-xs">{key.capsuleId}</td>
                          <td className="p-2 font-mono text-xs">{key.accessorId}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(key.computedStatus)}`}></div>
                              <span className="capitalize">{key.computedStatus}</span>
                            </div>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDate(key.issuedAt)}</td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDate(key.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">Audit Log ({auditLogs.length} events)</CardDescription>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getEventTypeColor(log.eventType)}>
                              {log.eventType}
                            </Badge>
                            <Badge variant="outline">{log.status}</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <div><span className="font-semibold">Capsule:</span> <span className="font-mono text-xs">{log.capsuleId}</span></div>
                            <div><span className="font-semibold">Accessor:</span> <span className="font-mono text-xs">{log.accessorId}</span></div>
                            {log.reason && <div><span className="font-semibold">Reason:</span> {log.reason}</div>}
                            {log.burstId && <div><span className="font-semibold">Burst ID:</span> <span className="font-mono text-xs">{log.burstId}</span></div>}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {formatDate(log.timestamp)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Medics Tab */}
            {activeTab === 'medics' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">Medic Registry ({medics.length})</CardDescription>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Medic ID</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">License Number</th>
                        <th className="p-2 text-left">Verified</th>
                        <th className="p-2 text-left">Public Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medics.map((medic) => (
                        <tr key={medic.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{medic.id}</td>
                          <td className="p-2">{medic.name}</td>
                          <td className="p-2 font-mono">{medic.licenseNumber}</td>
                          <td className="p-2">
                            {medic.verified ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 font-mono text-xs">{medic.publicKey?.substring(0, 20)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold">
                  All Transactions ({transactions.length})
                </CardDescription>
                
                {/* Transaction Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {transactions.filter(tx => tx.source === 'blockchain').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Blockchain Events</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {transactions.filter(tx => tx.source === 'queue' && tx.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Queue</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {transactions.filter(tx => tx.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Confirmed</div>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Source</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-left">TX Hash</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Details</th>
                        <th className="p-2 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, index) => (
                        <tr key={tx.txId || index} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <Badge variant={tx.source === 'blockchain' ? 'default' : 'secondary'}>
                              {tx.source}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={tx.type === 'CapsuleCreated' ? 'bg-green-500' : 
                                           tx.type === 'BurstKeyIssued' ? 'bg-blue-500' : 
                                           'bg-purple-500'}>
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <a
                              href={`${BLOCKDAG_EXPLORER}/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-xs"
                            >
                              {tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {tx.status === 'confirmed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {tx.status === 'pending' && <Clock className="w-4 h-4 text-blue-500" />}
                              {tx.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                              <span className="capitalize">{tx.status}</span>
                            </div>
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {tx.metadata?.capsuleId && (
                              <div>Capsule: {tx.metadata.capsuleId}</div>
                            )}
                            {tx.metadata?.burstId && (
                              <div>Burst: {tx.metadata.burstId}</div>
                            )}
                            {tx.metadata?.accessor && (
                              <div>Accessor: {tx.metadata.accessor.substring(0, 10)}...</div>
                            )}
                            {tx.blockNumber && (
                              <div>Block: {tx.blockNumber}</div>
                            )}
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900">
                All data is live from Firebase and BlockDAG. Click blockchain IDs to view on explorer.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

