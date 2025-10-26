const Legal = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-heading font-bold text-3xl">Legal & Will</h1>
        <div className="space-y-4 text-muted-foreground">
          <p>Manage your legal documents, will directives, and beneficiaries securely inside your EverGuard vault.</p>
          <ul className="list-disc pl-6">
            <li>Upload and encrypt critical documents (IDs, policies, will PDFs)</li>
            <li>Assign trusted contacts for time-locked or event-based sharing</li>
            <li>Track access in an immutable on-chain audit log</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Legal;


