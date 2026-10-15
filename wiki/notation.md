# Notation and conventions

Every article in Ketbook uses the symbols below. A page that needs something else defines it where it first appears.

## States and configurations

| Symbol | Meaning |
| --- | --- |
| $N$ | number of lattice sites, or of particles in continuum problems |
| $\boldsymbol{\sigma}=(\sigma_1,\dots,\sigma_N)$ | a basis configuration; for spin-$\tfrac12$ in the $S^z$ basis, $\sigma_i=\pm1$ |
| $\Psi_\theta(\boldsymbol{\sigma})=\langle\boldsymbol{\sigma}\vert\Psi_\theta\rangle$ | unnormalized amplitude produced by the network with parameters $\theta$ |
| $\theta\in\mathbb R^{N_p}$ or $\mathbb C^{N_p}$ | the $N_p$ variational parameters |
| $p_\theta(\boldsymbol{\sigma})\propto\lvert\Psi_\theta(\boldsymbol{\sigma})\rvert^2$ | the normalized sampling distribution |
| $E_0,E_1$ | exact ground-state and first-excited energies of $H$ in the sector considered |
| $e=E/N$ | energy per site |

## Estimators

| Symbol | Meaning |
| --- | --- |
| $N_s$ | number of Monte Carlo samples used for one estimate |
| $\langle\cdot\rangle$ | expectation over $p_\theta$; $\mathbb E_{p_\theta}$ when the distribution must be explicit |
| $E_{\mathrm{loc}}(\boldsymbol{\sigma})=\sum_{\boldsymbol{\sigma}'}H_{\boldsymbol{\sigma}\boldsymbol{\sigma}'}\Psi_\theta(\boldsymbol{\sigma}')/\Psi_\theta(\boldsymbol{\sigma})$ | local energy |
| $E_\theta=\langle E_{\mathrm{loc}}\rangle$ | variational energy |
| $\operatorname{Var}_\theta(H)=\langle\lvert E_{\mathrm{loc}}\rvert^2\rangle-\lvert E_\theta\rvert^2$ | energy variance of the state |
| $O_k(\boldsymbol{\sigma})=\partial_{\theta_k}\log\Psi_\theta(\boldsymbol{\sigma})$ | log-derivative with respect to parameter $k$ |
| $\bar X=X-\langle X\rangle$ | a centred quantity |
| $\tau_{\mathrm{int}}$, $N_{\mathrm{eff}}=N_s/2\tau_{\mathrm{int}}$ | integrated autocorrelation time and effective sample size |

## Optimization

| Symbol | Meaning |
| --- | --- |
| $F_k$ | energy gradient, $2\operatorname{Re}\langle\bar O_k^*\bar E_{\mathrm{loc}}\rangle$ for real $\theta$ and $\langle\bar O_k^*\bar E_{\mathrm{loc}}\rangle$ for holomorphic complex $\theta$ |
| $S_{kk'}=\langle\bar O_k^*\bar O_{k'}\rangle$ | quantum geometric tensor restricted to the variational manifold |
| $\eta$ | learning rate, equal to the imaginary-time step in stochastic reconfiguration |
| $\lambda$ | regularization strength |
| $X\in\mathbb C^{N_s\times N_p}$, $\varepsilon\in\mathbb C^{N_s}$ | centred, $\sqrt{N_s}$-normalized log-derivative matrix and local-energy vector, so that $S=X^\dagger X$ and $F=X^\dagger\varepsilon$ |

## Hamiltonians

- Spin operators are $\mathbf S_i=\tfrac12\boldsymbol{\sigma}_i$ with $\hbar=1$. A Hamiltonian written with Pauli matrices has energies four times larger for bilinear terms; benchmark definitions always state which is meant.
- $\langle i,j\rangle$ runs over nearest-neighbour bonds, $\langle\!\langle i,j\rangle\!\rangle$ over next-nearest-neighbour bonds, each undirected bond counted once.
- Lattice sizes are written $L\times L$ with $N=L^2$; periodic boundary conditions in all directions unless stated.
- Fermionic operators $c^\dagger_{i\sigma}$, $n_{i\sigma}=c^\dagger_{i\sigma}c_{i\sigma}$; the Hubbard hopping is $-t$ with $t>0$.

## Citations

References are given as arXiv identifiers, which resolve to every version of a paper and to its journal record. A quantitative claim cites the table, equation or figure it comes from.
