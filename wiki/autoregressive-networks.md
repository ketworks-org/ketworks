# Autoregressive and recurrent networks

> **In brief.** An autoregressive wavefunction writes the amplitude as a product of normalized conditionals, $\Psi(\boldsymbol\sigma)=\prod_i\psi_i(\sigma_i\mid\sigma_{<i})$, in a fixed ordering of the sites. The state is normalized by construction and $\lvert\Psi\rvert^2$ can be sampled exactly, one site at a time, without a Markov chain: no autocorrelation, no equilibration, no stuck walkers. Recurrent networks, masked convolutions and decoder transformers realize the conditionals. The price is the ordering, which breaks lattice symmetry and makes sampling sequential, and a phase that must be produced alongside the probabilities. On frustrated magnets the family trails group-convolutional and transformer states in energy, but it is the basis of variational annealing, of iterative retraining across sizes, and of most applications outside ground-state search.

Notation follows the [conventions page](../notation/).

## Definition

Fix an ordering $i=1,\dots,N$ of the sites and write

$$
\Psi_\theta(\boldsymbol\sigma)=\prod_{i=1}^{N}\psi_i(\sigma_i\mid\sigma_1,\dots,\sigma_{i-1}),\qquad
\sum_{\sigma_i}\bigl\lvert\psi_i(\sigma_i\mid\sigma_{<i})\bigr\rvert^2=1 .
$$

Each conditional is a function of the earlier spins only, produced by a network whose output for site $i$ is masked from the inputs $\sigma_{\ge i}$. Normalization of every conditional makes $\sum_{\boldsymbol\sigma}\lvert\Psi_\theta\rvert^2=1$, and the chain rule turns sampling into $N$ sequential draws: sample $\sigma_1$ from $\lvert\psi_1\rvert^2$, then $\sigma_2$ from $\lvert\psi_2(\cdot\mid\sigma_1)\rvert^2$, and so on. The samples are independent, so the error bar of an estimator is the plain standard error with no [binning analysis](../variational-monte-carlo/) needed, and the local energy is estimated exactly as in ordinary VMC. Normalization also gives access to quantities an unnormalized ansatz lacks: fidelities, Rényi entropies, and the Shannon entropy of $\lvert\Psi\rvert^2$ used in annealing.

The phase is attached separately. The usual choice, $\psi_i=\sqrt{p_i(\sigma_i\mid\sigma_{<i})}\,e^{i\varphi_i(\sigma_i\mid\sigma_{<i})}$ with a softmax head for $p_i$ and a second head for $\varphi_i$ (Hibat-Allah et al., arXiv:2002.02973), keeps the normalization intact. For stoquastic problems the phase head is dropped and $\Psi$ is positive; for the Heisenberg antiferromagnet the Marshall sign on the square lattice, or the three-sublattice rotation on the triangular lattice, is applied as a basis change before the positive network (Moss et al., arXiv:2505.20406).

## Architectures

- **Masked convolutions.** Sharir, Levine, Wies, Carleo and Shashua adapt PixelCNN: a stack of convolutions whose kernels are masked so that the output at site $i$ sees only sites earlier in a raster ordering, with the $N$ conditionals computed in one forward pass and $\ell_1$-normalized per site (arXiv:1902.04057). The construction originates in the variational autoregressive networks of Wu, Wang and Zhang for classical statistical mechanics (arXiv:1809.10606).
- **Recurrent networks.** Hibat-Allah, Ganahl, Hayward, Melko and Carrasquilla feed the sites one at a time to a gated recurrent unit; the hidden state $\mathbf h_i$ summarizes $\sigma_{<i}$ and a softmax layer on $\mathbf h_i$ gives $p_i$ (arXiv:2002.02973). The parameter count is independent of $N$, which is what allows a trained network to be evaluated or retrained on a larger lattice. In two dimensions the hidden state at site $(x,y)$ is built from the states of its left and lower neighbours along a snake path (the 2D RNN), so that information flows from two directions rather than one.
- **Decoder transformers.** Attention over the earlier sites with a causal mask gives the same factorization with a global receptive field: the transformer quantum state (Zhang and Di Ventra, arXiv:2208.01758) and the large patched transformers for Rydberg arrays (Sprague and Czischek, arXiv:2306.03921), in which a patch of several atoms is one token and one conditional. See the [transformer page](../transformer-wavefunctions/).
- **Fermions in second quantization.** With orbitals as the ordered sites, the same factorization represents an electronic wavefunction in a basis of Slater determinants; Barrett, Malyshev and Lvovsky use it for molecules with up to 30 spin-orbitals with physical constraints (particle number, spin) enforced by masking the conditionals (arXiv:2109.12606).

## Symmetries

- **$U(1)$.** A fixed $S^z$ or particle number is imposed exactly by zeroing, in each conditional, the outcomes that would make the constraint unsatisfiable, and renormalizing. Sampling then never leaves the sector.
- **Lattice symmetries.** The ordering breaks translations and the point group. They are restored by averaging over the group: Hibat-Allah, Melko and Carrasquilla symmetrize the 2D RNN under $C_{4v}$ on the square lattice and under the corresponding group of the triangular lattice and report systematically lower energies at no extra parameters (arXiv:2207.14314). The construction keeps exact sampling: the symmetrized probability is the group average $\frac{1}{\lvert G\rvert}\sum_{g}p_\theta(g\boldsymbol\sigma)$, which is sampled by drawing $\boldsymbol\sigma$ from the network and applying a uniformly random $g$, and the phase is the argument of the group-averaged phase factor, with the character of the target representation included (arXiv:2002.02973, Appendix D). Evaluating the symmetrized amplitude costs $\lvert G\rvert$ forward passes.
- **Ordering.** The snake path and the 2D RNN reduce but do not remove the bias toward correlations along the path. There is no canonical ordering on a triangular lattice, and part of the gap to symmetric architectures on that lattice is attributed to it.

## Training

The energy gradient is the standard VMC estimator with independent samples. Two techniques are specific to the family.

- **Variational neural annealing.** Because $\lvert\Psi_\theta\rvert^2$ is normalized, its Shannon entropy $S$ is computable, and one can minimize the pseudo free energy $F=E-T(t)\,S$ with a temperature annealed from $T_0$ to zero (Hibat-Allah, Inack, Wiersema, Melko, Carrasquilla, arXiv:2101.10154). The entropy term keeps the distribution broad early in the optimization and avoids collapse onto a few configurations; for the triangular $6\times6$ cluster the annealing schedule is the main determinant of the final accuracy (arXiv:2505.20406, Sec. IV A).
- **Iterative retraining.** A recurrent network trained on a small lattice is used as the initialization for a larger one, since its parameters do not depend on $N$ (Roth, arXiv:2003.06228). Moss et al. retrain from $L=6$ up to $L=30$ on the triangular lattice, with the accuracy of the first stage propagating through the series (arXiv:2505.20406).

## Results

On the triangular Heisenberg tori the 2D RNN gives $e=-0.5562(2)$ on $6\times6$ against the exact $-0.5603734$, and $-0.54861(1)$, $-0.54810(1)$ and $-0.54793(1)$ on $18\times18$, $24\times24$ and $30\times30$ (Moss et al., arXiv:2505.20406; as tabulated in arXiv:2602.02665, Table I). A zero-variance extrapolation of the series gives $e_\infty=-0.5517569(9)$ and a magnetization of $0.19$ to $0.20$, see the [triangular page](../triangular-heisenberg/). The variational energies lie $3$ to $4\times10^{-3}$ above the transformer values on the same tori, and the gap grows with $L$; the extrapolated thermodynamic-limit energies of the two methods differ by $8\times10^{-5}$, within the uncertainty of the extrapolations rather than of the states.

For Rydberg arrays the patched transformers reach energies below the quantum Monte Carlo reference data used to benchmark them (arXiv:2306.03921); for molecules the autoregressive ansatz matches or beats coupled-cluster energies on small strongly correlated systems (arXiv:2109.12606). Neither is a Ketboard instance.

## What limits the family

Sampling is sequential in $N$ and cannot be batched over sites, so a sample costs $O(N)$ network steps even when the Markov-chain alternative would have accepted a local move cheaply. Depth and width are limited by this cost. The ordering is a bias that symmetrization reduces at a cost of $\lvert G\rvert$; architectures that are symmetric by construction do not pay it. And the phase head is trained only through the local energy, which is a weak signal when the sign structure is far from a product form, the same difficulty met by every amplitude-plus-phase construction (see the [RBM page](../restricted-boltzmann-machine/)). The family's advantages, exact sampling, normalization and size transfer, are the ones that matter for dynamics, thermal states, annealing and reconstruction from data, which is where it is mostly used.

## References

- D. Wu, L. Wang, P. Zhang, *Solving statistical mechanics using variational autoregressive networks*, arXiv:1809.10606 (2018). Autoregressive networks for Boltzmann distributions; the origin of the construction.
- O. Sharir, Y. Levine, N. Wies, G. Carleo, A. Shashua, *Deep autoregressive models for the efficient variational simulation of many-body quantum systems*, arXiv:1902.04057 (2019). PixelCNN-type NQS; exact sampling.
- M. Hibat-Allah, M. Ganahl, L. E. Hayward, R. G. Melko, J. Carrasquilla, *Recurrent neural network wave functions*, arXiv:2002.02973 (2020). 1D and 2D RNN wavefunctions with modulus and phase heads.
- M. Hibat-Allah, E. M. Inack, R. Wiersema, R. G. Melko, J. Carrasquilla, *Variational neural annealing*, arXiv:2101.10154 (2021).
- C. Roth, *Iterative retraining of quantum spin models using recurrent neural networks*, arXiv:2003.06228 (2020).
- M. Hibat-Allah, R. G. Melko, J. Carrasquilla, *Supplementing recurrent neural network wave functions with symmetry and annealing to improve accuracy*, arXiv:2207.14314 (2022).
- M. S. Moss, R. Wiersema, M. Hibat-Allah, J. Carrasquilla, R. G. Melko, *Leveraging recurrence in neural network wavefunctions for large-scale simulations of Heisenberg antiferromagnets on the triangular lattice*, arXiv:2505.20406 (2025).
- Y.-H. Zhang, M. Di Ventra, *Transformer quantum state: a multi-purpose model for quantum many-body problems*, arXiv:2208.01758 (2022).
- K. Sprague, S. Czischek, *Variational Monte Carlo with large patched transformers*, arXiv:2306.03921 (2023).
- T. D. Barrett, A. Malyshev, A. I. Lvovsky, *Autoregressive neural-network wavefunctions for ab initio quantum chemistry*, arXiv:2109.12606 (2021).
