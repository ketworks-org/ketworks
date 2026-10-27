# FermiNet and PauliNet

> **In brief.** Neural orbitals depend on the whole electron configuration, allowing a determinant to describe correlations beyond a mean-field state. FermiNet learns these orbitals directly, while PauliNet modifies a molecular reference and preserves explicit cusp conditions. Both use permutation-equivariant networks so that exchanging identical electrons changes only the sign of the wavefunction.

Notation follows the [conventions page](../notation/).

## From equivariance to antisymmetry

For fixed spin populations, a determinant expansion with a symmetric correlator has the form

$$
\Psi_\theta(\mathbf R)=e^{J_\theta(\mathbf R)}
\sum_{k=1}^{K}c_k\,
\det\Phi^{k\uparrow}_\theta(\mathbf R)\,
\det\Phi^{k\downarrow}_\theta(\mathbf R),
\qquad
[\Phi^{ks}_\theta]_{i\mu}=\phi^{ks}_{\mu}(\mathbf r_i;\mathbf R).
$$

Here $s\in\{\uparrow,\downarrow\}$, each matrix has $N_s$ electron rows and $N_s$ orbital columns, and $K$ is the number of terms. The orbital's dependence on $\mathbf R$ must respect particle exchange. If $P_s$ permutes electrons of spin $s$, the required transformation is

$$
\Phi^{ks}_\theta(P_s\mathbf R)=P_s\Phi^{ks}_\theta(\mathbf R),
\qquad
\Phi^{k\bar s}_\theta(P_s\mathbf R)=\Phi^{k\bar s}_\theta(\mathbf R).
$$

The determinant identity $\det(P_s\Phi)=\det(P_s)\det\Phi$ then gives the fermionic sign. Invariance of the opposite-spin matrix matters: its entries also depend on the moved electrons. Fixing $N_\uparrow,N_\downarrow$ fixes $S^z$, without imposing total spin; the [continuous-space introduction](../continuous-space/) explains this representation.

For real, finite $J_\theta$, multiplication by $e^{J_\theta}>0$ leaves the nodes unchanged. Changing the orbitals or the relative coefficients $c_k$ can move them. This is the distinction between a multiplicative correlator and backflow.

## FermiNet: learning the orbitals

FermiNet initializes one-electron features with electron–nucleus displacement vectors and distances, and pair features with electron–electron displacements and distances. Each layer mixes the feature of electron $i$ with averages of the one-electron features and of its pair features, separately for each spin. Shared residual updates preserve the exchange rule above. The final one-electron features produce the orbital matrices (Pfau et al., arXiv:1909.02487v3, Sec. II and Algorithm 1).

A useful form of the orbital output is

$$
\phi^{ks}_{\mu}(\mathbf r_i;\mathbf R)=
\bigl(\mathbf w^{ks}_{\mu}\cdot\mathbf h_i^L+b^{ks}_{\mu}\bigr)
\sum_A \pi^{ks}_{\mu A}
e^{-\alpha^{ks}_{\mu A}|\mathbf r_i-\mathbf R_A|},
\qquad \alpha^{ks}_{\mu A}>0.
$$

The bounded final features $\mathbf h_i^L$ carry correlations; the envelope supplies decay at infinity. This scalar-decay envelope is a simplification of the original anisotropic envelope (Spencer et al., arXiv:2011.07125v1, Sec. 3). Its coefficients need not be positive.

Distances allow nonanalytic behavior at coalescence, but do not fix the cusp slopes. Hartree–Fock orbitals can guide pretraining without constraining the optimized orbitals to that reference (arXiv:1909.02487v3, Appendix A).

## PauliNet: correcting a molecular reference

PauliNet starts from a compact expansion of reference molecular orbitals and combines a fixed cusp function $\gamma$, a neural Jastrow $J_\theta$, and orbital-dependent multiplicative backflow:

$$
\Psi_\theta(\mathbf R)=e^{\gamma(\mathbf R)+J_\theta(\mathbf R)}
\sum_p c_p\,
\det[\widetilde\phi^{p\uparrow}_{\mu i}]
\det[\widetilde\phi^{p\downarrow}_{\mu i}],
\qquad
\widetilde\phi^{ps}_{\mu i}
=\phi^{ps}_{\mu}(\mathbf r_i)\,f^{ps}_{\theta,\mu i}(\mathbf R).
$$

The reference orbitals include nuclear cusp corrections. The analytic electron–electron factor imposes the electronic cusps, while restrictions on the neural factors preserve them. An equivariant distance-based network builds the correlations (Hermann, Schätzle and Noé, arXiv:1909.08423v5, Secs. 2.1–2.2).

The orbital index on $f_{\theta,\mu i}$ is essential. A common nonzero factor $f_i$ multiplying every entry in electron row $i$ would factor out of the determinant as $\prod_i f_i$, leaving its zeros unchanged. Orbital-dependent factors instead alter the matrix's linear dependence and can change its nodal surface.

PauliNet therefore builds molecular structure and short-distance constraints into its parameterization. FermiNet instead constructs the orbitals from learned features and a decay envelope. The difference concerns the variational family, beyond the choice of initialization.

## Evaluating and comparing neural orbitals

Moving one electron generally changes every neural orbital. The matrix update is therefore not restricted to one row, as it is for fixed single-particle orbitals. The ordinary rank-one Slater update cannot be assumed; evaluating the network and coordinate derivatives contributes to the cost alongside the determinants.

The kinetic estimator requires gradients and Laplacians of the wavefunction. [Attention architectures](../attention-continuous-space/) change the feature construction and, in LapNet, its derivative structure. [Periodic states](../periodic-neural-states/) replace molecular decay with cell-compatible orbitals, while [message-passing backflow](../message-passing-backflow/) learns correlated coordinates or pair functions.

Accuracy comparisons require the same Hamiltonian, geometry, spin sector and energy convention. The [molecular benchmarks](../molecules/) provide those definitions and source-linked results; determinant count alone does not measure the flexibility or evaluation cost of a neural state.

## References

- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487v3 (2019). FermiNet's equivariant streams, orbitals and pretraining.
- J. S. Spencer, D. Pfau, A. Botev, W. M. C. Foulkes, *Better, Faster Fermionic Neural Networks*, arXiv:2011.07125v1 (2020). Simplified envelopes and determinant parameterization.
- J. Hermann, Z. Schätzle, F. Noé, *Deep-neural-network solution of the electronic Schrödinger equation*, arXiv:1909.08423v5 (2019). PauliNet's molecular reference, Jastrow and backflow factors.
