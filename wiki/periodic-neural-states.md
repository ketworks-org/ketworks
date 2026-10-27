# Periodic neural states

> **In brief.** A wavefunction in a periodic cell must obey its boundary phase whenever any one particle crosses the cell. Periodic features encode this constraint before the network is evaluated. Invariant pooling gives bosonic states, while Bloch-like neural orbitals give fermionic determinants; particle statistics and translation symmetry remain separate design choices.

Notation follows the [conventions page](../notation/).

## Boundary conditions as a feature constraint

For cell vectors $\mathbf L_a$ and reciprocal vectors $\mathbf b_a$, with $\mathbf L_a\cdot\mathbf b_b=2\pi\delta_{ab}$, a smooth periodic embedding is

$$
\mathbf p(\mathbf r)=
\bigl(\sin(\mathbf b_a\cdot\mathbf r),
\cos(\mathbf b_a\cdot\mathbf r)\bigr)_{a=1}^{d}.
$$

It obeys $\mathbf p(\mathbf r+\mathbf L_a)=\mathbf p(\mathbf r)$. Higher harmonics can add resolution. By contrast, a wrapped Cartesian coordinate jumps at the cell edge; feeding that jump into an unconstrained network does not enforce a smooth periodic wavefunction.

The boundary requirement applies independently to each particle. For electrons at twist $\mathbf k_s$,

$$
\Psi_\theta(\ldots,\mathbf r_i+\mathbf L_a,\ldots)
=e^{i\mathbf k_s\cdot\mathbf L_a}\Psi_\theta(\mathbf R).
$$

At $\Gamma$, the phase is unity. Periodicity of the modulus alone is insufficient at a nonzero twist: the complex amplitude must acquire the prescribed phase.

## Bosons: invariant pooling

Pescia et al. use periodic inputs and a Deep Sets architecture for interacting bosons. A sum-pooling version can be written

$$
\Psi_\theta(\mathbf R)=
\exp\left[
J_{\mathrm{short}}(\mathbf R)+
\rho_\theta\left(\sum_i\phi_\theta(\mathbf p(\mathbf r_i))\right)
\right].
$$

The same map $\phi_\theta$ acts on every particle, pooling removes their ordering, and $\rho_\theta$ maps the pooled features to a scalar. The real exponential describes a positive state, appropriate for a nodeless bosonic ground state. A separate short-range term can encode behavior dictated by the interaction. The paper also uses log-sum-exp pooling and relative-distance features (arXiv:2112.11957v1, Sec. II, Eqs. 2–5).

Exchange invariance follows immediately: a permutation only reorders terms in the sum. A particle crossing the cell leaves its periodic input unchanged. Neither argument requires the network to learn the corresponding symmetry from samples.

## Fermions: periodic orbitals and DeepSolid

DeepSolid extends neural molecular orbitals to solids using periodic coordinate features and Bloch factors (Li, Li and Chen, arXiv:2203.15472v2, Methods, Eqs. 4–9). A general form with the required boundary phase is

$$
\Phi_{i\mu}(\mathbf R)=
e^{i(\mathbf G_\mu+\mathbf k_s)\cdot\mathbf r_i}
u_{\theta,\mu i}(\mathbf R),
\qquad
\mathbf G_\mu\cdot\mathbf L_a\in2\pi\mathbb Z.
$$

Here $\mathbf G_\mu$ is a simulation-cell reciprocal vector. The collective factor $u_{\theta,\mu i}$ must be periodic in every electron coordinate and equivariant under same-spin exchanges.

Shifting electron $i$ by $\mathbf L_a$ leaves every $u$ unchanged and multiplies row $i$ by $e^{i\mathbf k_s\cdot\mathbf L_a}$, independently of $\mu$. The determinant acquires exactly that phase. This explains why all occupied orbitals must use a consistent twist. Periodic collective factors replace the decay envelopes used for isolated molecules.

## Periodicity and continuous translations

Cell periodicity and invariance under a common displacement are distinct. For example, $\sum_i\cos(\mathbf b_1\cdot\mathbf r_i)$ is symmetric under particle exchange and periodic, but changes when all particles move by a generic vector $\mathbf a$.

For a homogeneous system, features based only on relative coordinates satisfy

$$
\mathbf p\bigl((\mathbf r_i+\mathbf a)-(\mathbf r_j+\mathbf a)\bigr)
=\mathbf p(\mathbf r_i-\mathbf r_j).
$$

They can enforce continuous translation invariance of a correlator. A fermionic reference may still carry a total-momentum phase; its orbitals must select the intended momentum sector. In a crystal with fixed nuclei, translating electrons alone by an arbitrary vector is generally not a symmetry of the Hamiltonian.

[Message-passing backflow](../message-passing-backflow/) uses periodic relative features to correlate electron-gas orbitals. The [electron-gas](../homogeneous-electron-gas/) and [solid](../solids/) benchmark pages specify cell, twist, density and external potential. Correct network boundaries do not by themselves define the periodic interaction: the Hamiltonian's Coulomb summation and finite-cell convention must also agree.

When nuclei are quantum particles, their positions also enter the variational state and its kinetic energy. The [electron–nuclear architecture page](../electron-nuclear-neural-states/) develops the solid-hydrogen constructions and distinguishes nuclear localization from a state without a prescribed lattice.

## References

- G. Pescia, J. Han, A. Lovato, J. Lu, G. Carleo, *Neural-Network Quantum States for Periodic Systems in Continuous Space*, arXiv:2112.11957v1 (2021). Periodic Deep Sets for interacting bosons.
- X. Li, Z. Li, J. Chen, *Ab initio calculation of real solids via neural network ansatz*, arXiv:2203.15472v2 (2022). DeepSolid's periodic inputs and collective Bloch orbitals.
