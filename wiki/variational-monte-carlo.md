# Variational Monte Carlo

> **In brief.** The variational energy is the mean of a local energy over configurations sampled from $|\Psi_\theta|^2$. The local energy is cheap for sparse Hamiltonians, and its variance vanishes at an eigenstate, so the estimate gets more precise as the ansatz improves. Samples from a Markov chain are correlated; a reported error bar is only meaningful after a binning or autocorrelation analysis of a dedicated evaluation of the final state.

Notation follows the [conventions page](../notation/).

Variational Monte Carlo (VMC) turns the Rayleigh–Ritz principle into a stochastic algorithm. For a trial state $|\Psi_\theta\rangle$,

$$
E_\theta=\frac{\langle\Psi_\theta|H|\Psi_\theta\rangle}{\langle\Psi_\theta|\Psi_\theta\rangle}\ \ge\ E_0 ,
$$

and the two sums over the configuration basis hidden in this ratio are replaced by an average over samples drawn from $|\Psi_\theta|^2$. The method rests on two facts: the energy is the mean of a *local* quantity that is cheap to evaluate for a sparse Hamiltonian, and that quantity has zero variance when $|\Psi_\theta\rangle$ is an eigenstate.

## The local energy estimator

Work in an orthonormal basis $\{|\boldsymbol{\sigma}\rangle\}$ (spin configurations, occupation numbers, particle positions). Insert two resolutions of the identity:

$$
E_\theta=\frac{\sum_{\boldsymbol{\sigma}}|\Psi_\theta(\boldsymbol{\sigma})|^2\,E_{\mathrm{loc}}(\boldsymbol{\sigma})}{\sum_{\boldsymbol{\sigma}}|\Psi_\theta(\boldsymbol{\sigma})|^2}
=\mathbb{E}_{\boldsymbol{\sigma}\sim p_\theta}\!\left[E_{\mathrm{loc}}(\boldsymbol{\sigma})\right],
\qquad
p_\theta(\boldsymbol{\sigma})=\frac{|\Psi_\theta(\boldsymbol{\sigma})|^2}{\sum_{\boldsymbol{\sigma}'}|\Psi_\theta(\boldsymbol{\sigma}')|^2},
$$

with the local energy

$$
E_{\mathrm{loc}}(\boldsymbol{\sigma})=\frac{\langle\boldsymbol{\sigma}|H|\Psi_\theta\rangle}{\langle\boldsymbol{\sigma}|\Psi_\theta\rangle}
=\sum_{\boldsymbol{\sigma}'}H_{\boldsymbol{\sigma}\boldsymbol{\sigma}'}\,\frac{\Psi_\theta(\boldsymbol{\sigma}')}{\Psi_\theta(\boldsymbol{\sigma})} .
$$

The sum over $\boldsymbol{\sigma}'$ runs only over configurations connected to $\boldsymbol{\sigma}$ by a nonzero matrix element. For a lattice Hamiltonian with $N$ sites and short-range terms there are $O(N)$ such configurations, so one local energy costs $O(N)$ wavefunction ratios. The normalization of $\Psi_\theta$ never enters: only ratios $\Psi_\theta(\boldsymbol{\sigma}')/\Psi_\theta(\boldsymbol{\sigma})$ are needed, which is why unnormalized ansätze such as neural networks are usable at all.

For the spin-$\tfrac12$ Heisenberg model $H=J\sum_{\langle i,j\rangle}\mathbf{S}_i\cdot\mathbf{S}_j$ in the $S^z$ basis with $\sigma_i=\pm1$,

$$
E_{\mathrm{loc}}(\boldsymbol{\sigma})=J\sum_{\langle i,j\rangle}\left[\frac{\sigma_i\sigma_j}{4}+\frac{1-\sigma_i\sigma_j}{4}\,\frac{\Psi_\theta(\boldsymbol{\sigma}^{(ij)})}{\Psi_\theta(\boldsymbol{\sigma})}\right],
$$

where $\boldsymbol{\sigma}^{(ij)}$ is $\boldsymbol{\sigma}$ with spins $i$ and $j$ exchanged. The off-diagonal term contributes only on antiparallel bonds. After the Marshall sublattice rotation on a bipartite lattice the off-diagonal coefficient becomes $-\tfrac12$ and the ground state has positive amplitudes; for frustrated couplings no such rotation exists and the ratio carries a nontrivial sign, see the [J₁–J₂ benchmark page](../j1j2-square-lattice/).

In continuous space the sum over connected configurations becomes a differential operator: the kinetic energy turns the local energy into $-\tfrac12\sum_i[\nabla_i^2\log\Psi_\theta+(\nabla_i\log\Psi_\theta)^2]+V$, so each evaluation needs the gradient and Laplacian of the network with respect to the particle coordinates; see the [continuous-space page](../continuous-space/).

$E_{\mathrm{loc}}$ is complex in general. Its mean is real because $H$ is Hermitian; the imaginary part of the sample mean is pure noise and a useful sanity check.

## Sampling

Samples from $p_\theta$ are produced by a Markov chain with Metropolis–Hastings acceptance

$$
A(\boldsymbol{\sigma}\to\boldsymbol{\sigma}')=\min\!\left[1,\ \frac{q(\boldsymbol{\sigma}|\boldsymbol{\sigma}')}{q(\boldsymbol{\sigma}'|\boldsymbol{\sigma})}\left|\frac{\Psi_\theta(\boldsymbol{\sigma}')}{\Psi_\theta(\boldsymbol{\sigma})}\right|^2\right]
$$

for a proposal $q$. Single-spin flips are the generic choice; exchange moves on nearest-neighbour pairs conserve $S^z_{\mathrm{tot}}$ and restrict the chain to one magnetization sector, which is how the $S^z=0$ sector of a Ketboard instance is enforced in practice. Autoregressive architectures bypass the chain entirely and draw exact, independent samples from $p_\theta$ (Sharir et al., arXiv:1902.04057; Hibat-Allah et al., arXiv:2002.02973), at the price of constraining the functional form. For particles in continuous space the proposal is a continuous displacement, usually a Gaussian move of all particles with a width tuned to the acceptance rate.

Sampling $|\Psi_\theta|^2$ is always a positive distribution, so VMC has no sign problem in the Monte Carlo sense. The sign problem reappears as a *representation* problem: the ansatz must encode the sign or phase structure of the ground state, and for frustrated or fermionic Hamiltonians this is where the difficulty lives.

## The zero-variance property

If $H|\Psi_\theta\rangle=E|\Psi_\theta\rangle$ then $E_{\mathrm{loc}}(\boldsymbol{\sigma})=E$ for every configuration with nonzero amplitude. Hence the energy variance

$$
\operatorname{Var}_\theta(H)=\mathbb{E}_{p_\theta}\!\left[|E_{\mathrm{loc}}|^2\right]-\left|\mathbb{E}_{p_\theta}[E_{\mathrm{loc}}]\right|^2
=\frac{\langle\Psi_\theta|H^2|\Psi_\theta\rangle}{\langle\Psi_\theta|\Psi_\theta\rangle}-E_\theta^2
$$

vanishes exactly at any eigenstate, and the statistical error of the estimator vanishes with it.

1. **Noise shrinks as the ansatz improves.** The statistical error bar on $E_\theta$ scales as $\sqrt{\operatorname{Var}_\theta(H)/N_{\mathrm{eff}}}$, so a better wavefunction needs fewer samples for the same precision. This is the opposite of what happens for most other observables.

2. **The variance bounds the energy error.** Temple's inequality gives, when $E_\theta$ lies below the first excited energy $E_1$,

$$
0\ \le\ E_\theta-E_0\ \le\ \frac{\operatorname{Var}_\theta(H)}{E_1-E_\theta},
$$

and Weinstein's bound guarantees an eigenvalue within $\sqrt{\operatorname{Var}_\theta(H)}$ of $E_\theta$. The variance is therefore the only *intrinsic* quality measure available when the exact energy is unknown. The dimensionless V-score $N\operatorname{Var}_\theta(H)/(E_\theta-E_\infty)^2$ of Wu et al. (arXiv:2302.04919) builds on exactly this.

3. **Variance extrapolation is not a variational energy.** Plotting $E$ against $\operatorname{Var}(H)$ for a family of states and extrapolating to zero variance produces estimates that are typically more accurate than any member of the family, but no longer satisfy $E\ge E_0$ and depend on the extrapolation model. Ketboard records the directly evaluated $E_\theta$ only; extrapolated values belong in the paper, not in the table.

Report $\operatorname{Var}_\theta(H)$, or the variance per site, next to every energy. Two states with the same energy and different variances are not equally close to the ground state.

## Error bars and autocorrelation

Markov-chain samples are correlated, and the naive standard error $\sqrt{\operatorname{Var}(E_{\mathrm{loc}})/N_s}$ underestimates the true uncertainty, often by an order of magnitude. Let $\rho(t)$ be the normalized autocorrelation of the sequence $E_{\mathrm{loc}}(\boldsymbol{\sigma}_1),E_{\mathrm{loc}}(\boldsymbol{\sigma}_2),\dots$ at lag $t$. The integrated autocorrelation time

$$
\tau_{\mathrm{int}}=\frac12+\sum_{t=1}^{\infty}\rho(t)
$$

sets the effective number of independent samples $N_{\mathrm{eff}}=N_s/(2\tau_{\mathrm{int}})$, and the variance of the sample mean $\bar E$ is

$$
\operatorname{Var}(\bar E)=\frac{2\tau_{\mathrm{int}}}{N_s}\operatorname{Var}(E_{\mathrm{loc}})\qquad(N_s\gg\tau_{\mathrm{int}}).
$$

Estimating $\tau_{\mathrm{int}}$ by summing the empirical $\rho(t)$ requires a truncation window, because the tail of the estimated autocorrelation is itself noisy; the standard rule truncates at the smallest $W$ with $W\ge c\,\tau_{\mathrm{int}}(W)$ for $c\approx 5$–$10$ (Sokal's windowing; the $\Gamma$-method of Wolff, arXiv:hep-lat/0306017, includes an error estimate for $\tau_{\mathrm{int}}$ itself).

The **binning (blocking) analysis** avoids estimating $\rho(t)$ explicitly. Partition the chain into $N_b$ consecutive blocks of length $b$, form the block means $\bar E_k$, and compute

$$
\hat\sigma^2_b=\frac{1}{N_b(N_b-1)}\sum_{k=1}^{N_b}\left(\bar E_k-\bar E\right)^2 .
$$

As $b$ grows past a few $\tau_{\mathrm{int}}$ the block means decorrelate and $\hat\sigma_b^2$ saturates; the plateau value is the variance of $\bar E$, and $\tau_{\mathrm{int}}$ follows from the ratio of the plateau to the naive estimate. Doubling $b$ until the plateau is reached, with at least $N_b\gtrsim 30$ blocks left, is the usual procedure (Ambegaokar and Troyer, arXiv:0906.0943). A binning curve that is still rising at the largest block size means the chain is too short for a trustworthy error bar.

With $M$ independent chains, the variance of the chain means gives a second estimate; the ratio of between-chain to within-chain variance (the Gelman–Rubin $\hat R$) exposes chains stuck in different regions of configuration space, a common failure for ansätze with sharp sign structure. Discard the warm-up portion of each chain; the length needed is itself of order several $\tau_{\mathrm{int}}$, measured from a cold or random start.

Two pitfalls are specific to variational calculations:

- **Optimization traces are not measurements.** Energies recorded during optimization are correlated through the parameter trajectory, and their scatter mixes statistical noise with parameter drift. A reported energy must come from a separate evaluation of the *final, fixed* state with its own binning analysis.
- **Samples shared between the energy and the gradient.** The same configurations are normally used for both, which is fine for the estimate but means the gradient noise is correlated with the energy noise; the fluctuation of $E_\theta$ below $E_0$ in a single short evaluation is not a violation of the variational principle, only of statistics.

Report $\bar E$, its standard error from the plateau, $\tau_{\mathrm{int}}$ or the block size used, $N_s$, the number of chains, and the variance $\operatorname{Var}_\theta(H)$. State whether the quoted uncertainty is one standard error of the mean; Ketboard displays the uncertainty with its declared meaning and never invents one.

## Where the gradient comes from

The same samples give the energy gradient without any extra Hamiltonian evaluations. With the log-derivatives $O_k(\boldsymbol{\sigma})=\partial_{\theta_k}\log\Psi_\theta(\boldsymbol{\sigma})$,

$$
\partial_{\theta_k}E_\theta=2\operatorname{Re}\!\left[\mathbb{E}_{p_\theta}\!\left[O_k^*\,E_{\mathrm{loc}}\right]-\mathbb{E}_{p_\theta}[O_k^*]\,\mathbb{E}_{p_\theta}[E_{\mathrm{loc}}]\right],
$$

which is also a zero-variance estimator at an eigenstate because the centred local energy $E_{\mathrm{loc}}-E_\theta$ vanishes there. How this gradient is turned into a parameter update is the subject of the [optimization page](../optimization/).

## References

- W. L. McMillan, *Ground state of liquid He⁴*, Phys. Rev. 138, A442 (1965). The first variational Monte Carlo calculation.
- F. Becca, S. Sorella, *Quantum Monte Carlo Approaches for Correlated Systems*, Cambridge University Press (2017). Textbook treatment of estimators, sampling and stochastic reconfiguration.
- A. W. Sandvik, *Computational studies of quantum spin systems*, arXiv:1101.3281 (2010). Lecture notes; Monte Carlo error analysis in Section 3.
- U. Wolff, *Monte Carlo errors with less errors*, arXiv:hep-lat/0306017 (2003). The $\Gamma$-method for autocorrelation analysis, with an error estimate for $\tau_{\mathrm{int}}$.
- V. Ambegaokar, M. Troyer, *Estimating errors reliably in Monte Carlo simulations of the Ehrenfest model*, arXiv:0906.0943 (2009). The binning analysis from first principles.
- D. Wu et al., *Variational benchmarks for quantum many-body problems*, arXiv:2302.04919 (2023). The V-score and the varbench dataset.
- O. Sharir, Y. Levine, N. Wies, G. Carleo, A. Shashua, *Deep autoregressive models for the efficient variational simulation of many-body quantum systems*, arXiv:1902.04057 (2019). Exact sampling from autoregressive NQS.
- M. Hibat-Allah, M. Ganahl, L. E. Hayward, R. G. Melko, J. Carrasquilla, *Recurrent neural network wave functions*, arXiv:2002.02973 (2020).
