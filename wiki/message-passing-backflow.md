# Message-passing backflow and pairing

> **In brief.** A particle graph can turn relative coordinates into equivariant many-body features. These features can displace the coordinates entering reference orbitals or modify pair functions in a Pfaffian. Message passing supplies correlations, while the determinant or Pfaffian supplies the fermionic exchange sign.

Notation follows the [conventions page](../notation/).

## Equivariant particle graphs

Let $\mathbf h_i$ denote a particle feature and $\mathbf e_{ij}$ a pair feature. A schematic message-passing layer is

$$
\mathbf m_i=\sum_{j\ne i}
M_\theta(\mathbf h_i,\mathbf h_j,\mathbf e_{ij}),
\qquad
\mathbf h_i'=U_\theta(\mathbf h_i,\mathbf m_i).
$$

The maps $M_\theta,U_\theta$ share parameters across particles. Relabeling particles relabels the summation terms and the output features, provided the pair features transform with both indices. Updating edge features can preserve the same property. Spin labels or spin-pair features distinguish the exchange groups.

This template describes a family of networks rather than a particular implementation. A complete graph already connects every particle in one layer; additional layers refine the dependence on the other particles' environments. [Periodic features](../periodic-neural-states/) can enforce cell boundaries before those updates.

## MP-NQS: coordinates and orbital corrections

MP-NQS learns a backflow displacement from the final node features,

$$
\mathbf y_i(\mathbf R)=\mathbf r_i+\delta\mathbf r_{\theta,i}(\mathbf R).
$$

Its node and edge updates use particle attention, with query/key products contracted over an intermediate particle index. This differs from ordinary attention's contraction over feature components. For the homogeneous electron gas, the network uses periodic relative features and evaluates plane-wave orbitals at the resulting, potentially complex, coordinates. An additional permutation-invariant, orbital-dependent correction multiplies the orbitals (Pescia et al., arXiv:2305.07240v3, Sec. II.2 and Appendices B–D):

$$
\varphi_\mu(\mathbf y_i;\mathbf Y)
=e^{J_{\theta,\mu}(\mathbf Y)}\phi_\mu(\mathbf y_i),
\qquad
\mathbf Y=(\mathbf y_1,\ldots,\mathbf y_N).
$$

Determinants of these orbitals preserve the exchange sign. Relative inputs also let the displacement respect continuous translations without introducing a preferred origin. The [electron-gas page](../homogeneous-electron-gas/) gives the finite-system benchmark definitions.

## What a coordinate transformation changes

For a real, finite symmetric $J$ and an equivariant real coordinate map $\mathbf Y$, consider the simpler backflow state

$$
\Psi_\theta(\mathbf R)=e^{J_\theta(\mathbf R)}
\Phi_0(\mathbf Y_\theta(\mathbf R)).
$$

If the reference nodal set is $\mathcal N_0=\{\mathbf Y:\Phi_0(\mathbf Y)=0\}$, the new nodal set is its preimage $\mathbf Y_\theta^{-1}(\mathcal N_0)$. Thus the coordinate map can move nodes even though the positive factor cannot. This argument concerns real coordinate backflow; complex displacements and direct neural orbital corrections enlarge the construction.

Backflow here defines a wavefunction by composition. It is not a probability-density change of variables, so no Jacobian determinant is automatically appended. Samples still come from $|\Psi_\theta(\mathbf R)|^2$ in the physical coordinates.

## Pair functions and Pfaffians

For even $N$, an antisymmetric pair matrix $A_\theta(\mathbf R)$ gives

$$
\Psi_\theta(\mathbf R)=e^{J_\theta(\mathbf R)}
\operatorname{Pf}A_\theta(\mathbf R),
\qquad A_\theta^{\mathsf T}=-A_\theta.
$$

A pair network must also obey $A_\theta(P\mathbf R)=P A_\theta(\mathbf R)P^{\mathsf T}$ for the required exchanges. Then

$$
\operatorname{Pf}(PAP^{\mathsf T})=\det(P)\operatorname{Pf}(A).
$$

For four particles, $\operatorname{Pf}A=A_{12}A_{34}-A_{13}A_{24}+A_{14}A_{23}$: the amplitude sums signed pairings. In the balanced opposite-spin case, a block matrix with off-diagonal pair matrix $F$ satisfies

$$
\operatorname{Pf}
\begin{pmatrix}0&F\\-F^{\mathsf T}&0\end{pmatrix}
=(-1)^{n(n-1)/2}\det F,\qquad N=2n.
$$

Here the rows and columns of $F$ label particles of opposite spin, not particles and single-particle orbitals. A pairing determinant therefore has a different interpretation from a Slater determinant.

Kim et al. combine a Pfaffian–Jastrow state with message-passing backflow for ultracold Fermi gases across the BCS–BEC crossover (arXiv:2305.08831v1). Pairing is built into the antisymmetric reference, and the network adds many-body correlations. The physical interaction and its short-distance behavior differ from Coulomb electrons; an electronic cusp factor cannot simply be transferred.

## Choosing the antisymmetric object

The graph network and its output are separate choices: the same equivariance principle supports coordinates, orbital entries or pair functions. [FermiNet and PauliNet](../neural-orbitals/) describe orbital constructions, while [fermionic neural states](../fermionic-neural-states/) covers related determinant and Pfaffian ideas on a lattice. A paired reference makes pairing accessible to the ansatz; establishing long-range order still requires observables and finite-size analysis.

## References

- G. Pescia, J. Nys, J. Kim, A. Lovato, G. Carleo, *Message-Passing Neural Quantum States for the Homogeneous Electron Gas*, arXiv:2305.07240v3 (2023). Particle attention, complex coordinate backflow and orbital corrections.
- J. Kim, G. Pescia, B. Fore, J. Nys, G. Carleo, S. Gandolfi, M. Hjorth-Jensen, A. Lovato, *Neural-network quantum states for ultra-cold Fermi gases*, arXiv:2305.08831v1 (2023). Pfaffian–Jastrow states with message-passing backflow.
