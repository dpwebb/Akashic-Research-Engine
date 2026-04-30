import { researchDataset } from '../../shared/researchData.js';

export function ClaimsPage() {
  return (
    <section className="page-stack">
      <header className="page-header compact">
        <p className="eyebrow">Claim extraction</p>
        <h1>Claims</h1>
        <p>Claims are labeled separately from the source summary and assigned an evidence grade.</p>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Type</th>
              <th>Grade</th>
              <th>Confidence</th>
              <th>Citation</th>
            </tr>
          </thead>
          <tbody>
            {researchDataset.claims.map((claim) => (
              <tr key={claim.id}>
                <td>
                  <strong>{claim.text}</strong>
                  <span>{claim.notes}</span>
                </td>
                <td>{claim.type}</td>
                <td>
                  <span className={`grade grade-${claim.evidenceGrade.toLowerCase()}`}>{claim.evidenceGrade}</span>
                </td>
                <td>{claim.confidenceLevel}</td>
                <td>{claim.citationRequired ? 'required' : 'optional'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
